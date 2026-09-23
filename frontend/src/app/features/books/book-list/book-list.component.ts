import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, debounceTime } from 'rxjs';
import { ApiError } from '../../../core/models/api.model';
import { Book, BookFilters } from '../../../core/models/book.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { BookTableComponent } from '../../../shared/components/book-table/book-table.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

type StockFilter = 'all' | 'in' | 'out';

const LOW_STOCK_LIMIT = 3;

@Component({
  selector: 'app-book-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe, IconComponent, BookTableComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css'
})
export class BookListComponent implements OnInit {
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private fb = inject(NonNullableFormBuilder);

  books = signal<Book[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  activeFilters = signal<BookFilters>({});

  // author id -> name, used for the author column and the search
  authorNames = signal(new Map<number, string>());
  authorsError = signal<string | null>(null);

  // search box works on the loaded list, stock/price filters go to the api
  search = signal('');

  filterForm = this.fb.group({
    stock: this.fb.control<StockFilter>('all'),
    minPrice: this.fb.control<number | null>(null, Validators.min(0))
  });

  visibleBooks = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.books();
    }
    return this.books().filter(
      (book) =>
        book.title.toLowerCase().includes(term) ||
        book.isbn.includes(term) ||
        (this.authorNames().get(book.authorId) ?? '').toLowerCase().includes(term)
    );
  });

  stats = computed(() => {
    const books = this.books();
    const units = books.reduce((total, book) => total + book.stock, 0);
    return {
      titles: books.length,
      authors: new Set(books.map((book) => book.authorId)).size,
      units,
      average: books.length ? units / books.length : 0,
      value: books.reduce((total, book) => total + book.price * book.stock, 0),
      low: books.filter((book) => book.stock > 0 && book.stock <= LOW_STOCK_LIMIT).length,
      out: books.filter((book) => book.stock === 0).length
    };
  });

  hasFilters = computed(() => Object.keys(this.activeFilters()).length > 0 || this.search().trim() !== '');

  private booksRequest?: Subscription;

  constructor() {
    // filters apply by themselves, the small delay avoids an api call on every key press
    this.filterForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed()).subscribe(() => {
      if (this.filterForm.valid) {
        this.loadBooks();
      }
    });
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loadBooks();
    this.loadAuthorNames();
  }

  loadBooks() {
    const filters = this.getFilters();
    this.loading.set(true);
    this.error.set(null);

    // cancel the previous request if filters changed before it finished
    this.booksRequest?.unsubscribe();
    this.booksRequest = this.bookService.getBooks(filters).subscribe({
      next: (books) => {
        this.books.set(books);
        this.activeFilters.set(filters);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  setStockFilter(value: StockFilter) {
    this.filterForm.controls.stock.setValue(value);
  }

  clearFilters() {
    this.search.set('');
    this.filterForm.reset();
  }

  // replace the updated book in the list, no need to reload everything
  onStockChanged(updated: Book) {
    this.books.update((books) => books.map((book) => (book.id === updated.id ? updated : book)));
  }

  exportCsv() {
    const header = ['Title', 'ISBN', 'Author', 'Price', 'Stock'];
    const rows = this.visibleBooks().map((book) => [
      book.title,
      book.isbn,
      this.authorNames().get(book.authorId) ?? '',
      book.price,
      book.stock
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'books.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadAuthorNames() {
    this.authorService.getAuthors().subscribe({
      next: (authors) => {
        this.authorNames.set(new Map(authors.map((author) => [author.id, author.name])));
        this.authorsError.set(null);
      },
      error: (err: ApiError) => this.authorsError.set(err.message)
    });
  }

  private getFilters(): BookFilters {
    const { stock, minPrice } = this.filterForm.getRawValue();
    const filters: BookFilters = {};

    if (stock !== 'all') {
      filters.inStock = stock === 'in';
    }
    if (minPrice !== null) {
      filters.minPrice = minPrice;
    }
    return filters;
  }
}
