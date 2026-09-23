import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { Book } from '../../../core/models/book.model';
import { BookService } from '../../../core/services/book.service';
import { avatarColors, coverGradient, initials } from '../../utils/colors';
import { IconComponent } from '../icon/icon.component';
import { StockDialogComponent } from '../stock-dialog/stock-dialog.component';

const LOW_STOCK_LIMIT = 3;

// books table used on the books page and on the author page
@Component({
  selector: 'app-book-table',
  imports: [RouterLink, CurrencyPipe, IconComponent, StockDialogComponent],
  templateUrl: './book-table.component.html',
  styleUrl: './book-table.component.css'
})
export class BookTableComponent {
  private bookService = inject(BookService);

  books = input.required<Book[]>();
  // author id -> name, the author column is hidden when this is not passed
  authorNames = input<Map<number, string>>();
  stockChanged = output<Book>();

  // quick +/- buttons: which rows are saving, and the last error for a row
  savingIds = signal(new Set<number>());
  rowError = signal<{ bookId: number; message: string } | null>(null);

  // book whose "custom amount" dialog is open
  adjusting = signal<Book | null>(null);

  // stock bars are drawn relative to the biggest stock in the list (at least 20)
  maxStock = computed(() => Math.max(20, ...this.books().map((book) => book.stock)));

  // +1 / -1 straight from the row, the api rejects it if stock would go below 0
  quickAdjust(book: Book, change: number) {
    this.setSaving(book.id, true);
    this.rowError.set(null);

    this.bookService.updateStock(book.id, change).subscribe({
      next: (updated) => {
        this.setSaving(book.id, false);
        this.stockChanged.emit(updated);
      },
      error: (err: ApiError) => {
        this.setSaving(book.id, false);
        this.rowError.set({ bookId: book.id, message: err.message });
      }
    });
  }

  authorName(authorId: number) {
    return this.authorNames()?.get(authorId) ?? `Author #${authorId}`;
  }

  stockStatus(book: Book): 'out' | 'low' | 'ok' {
    if (book.stock === 0) return 'out';
    if (book.stock <= LOW_STOCK_LIMIT) return 'low';
    return 'ok';
  }

  stockPercent(book: Book) {
    return Math.max((book.stock / this.maxStock()) * 100, 3);
  }

  cover(book: Book) {
    return coverGradient(book.id);
  }

  avatar(authorId: number) {
    return avatarColors(authorId);
  }

  authorInitials(authorId: number) {
    return initials(this.authorName(authorId));
  }

  private setSaving(bookId: number, saving: boolean) {
    this.savingIds.update((ids) => {
      const next = new Set(ids);
      if (saving) {
        next.add(bookId);
      } else {
        next.delete(bookId);
      }
      return next;
    });
  }
}
