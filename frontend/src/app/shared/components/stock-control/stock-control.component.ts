import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../../core/models/api.model';
import { Book } from '../../../core/models/book.model';
import { BookService } from '../../../core/services/book.service';

@Component({
  selector: 'app-stock-control',
  imports: [FormsModule],
  templateUrl: './stock-control.component.html',
  styleUrl: './stock-control.component.css'
})
export class StockControlComponent {
  private bookService = inject(BookService);

  book = input.required<Book>();
  stockChanged = output<Book>();

  quantity = 1;
  saving = signal(false);
  error = signal<string | null>(null);

  // direction: 1 = add to stock, -1 = remove from stock
  update(direction: 1 | -1) {
    const qty = Number(this.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      this.error.set('Quantity must be a whole number greater than 0');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.bookService.updateStock(this.book().id, direction * qty).subscribe({
      next: (book) => {
        this.saving.set(false);
        this.stockChanged.emit(book);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.error.set(err.message);
      }
    });
  }
}
