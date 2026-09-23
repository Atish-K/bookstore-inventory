import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { Book, BookFilters } from '../../../core/models/book.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { StockControlComponent } from '../../../shared/components/stock-control/stock-control.component';

@Component({
  selector: 'app-book-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, StockControlComponent],
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

  // author id -> name, only used to show the author column
  authorNames = signal(new Map<number, string>());
  authorsError = signal<string | null>(null);

  filterForm = this.fb.group({
    stock: this.fb.control<'all' | 'in' | 'out'>('all'),
    minPrice: this.fb.control<number | null>(null, Validators.min(0))
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loadBooks();
    this.loadAuthorNames();
  }

  loadBooks() {
    this.loading.set(true);
    this.error.set(null);

    this.bookService.getBooks(this.getFilters()).subscribe({
      next: (books) => {
        this.books.set(books);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    if (this.filterForm.invalid) {
      return;
    }
    this.loadBooks();
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadBooks();
  }

  // replace the updated book in the list, no need to reload everything
  onStockChanged(updated: Book) {
    this.books.update((books) => books.map((book) => (book.id === updated.id ? updated : book)));
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
