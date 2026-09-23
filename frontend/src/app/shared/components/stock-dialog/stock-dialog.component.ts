import { AfterViewInit, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../../core/models/api.model';
import { Book } from '../../../core/models/book.model';
import { BookService } from '../../../core/services/book.service';
import { ToastService } from '../../../core/services/toast.service';
import { coverGradient } from '../../utils/colors';
import { IconComponent } from '../icon/icon.component';

// popup to add or remove stock for one book, uses the native <dialog> element
@Component({
  selector: 'app-stock-dialog',
  imports: [FormsModule, IconComponent],
  templateUrl: './stock-dialog.component.html',
  styleUrl: './stock-dialog.component.css'
})
export class StockDialogComponent implements AfterViewInit {
  private bookService = inject(BookService);
  private toast = inject(ToastService);

  book = input.required<Book>();
  updated = output<Book>();
  closed = output<void>();

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  quantity = signal<number | null>(1);
  saving = signal<'add' | 'remove' | null>(null);
  error = signal<string | null>(null);

  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }

  cover() {
    return coverGradient(this.book().id);
  }

  step(amount: number) {
    this.quantity.update((qty) => Math.max(1, (qty ?? 0) + amount));
  }

  save(action: 'add' | 'remove') {
    const qty = Number(this.quantity());
    if (!Number.isInteger(qty) || qty < 1) {
      this.error.set('Quantity must be a whole number greater than 0');
      return;
    }

    this.saving.set(action);
    this.error.set(null);

    const change = action === 'add' ? qty : -qty;

    // no check for negative stock here on purpose, the api decides and we show its message
    this.bookService.updateStock(this.book().id, change).subscribe({
      next: (book) => {
        this.toast.success(`${book.title}: stock updated to ${book.stock}`);
        this.updated.emit(book);
        this.close();
      },
      error: (err: ApiError) => {
        this.saving.set(null);
        this.error.set(err.message);
      }
    });
  }

  close() {
    this.dialog().nativeElement.close();
  }

  // clicking on the dark area outside the box closes it
  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement && !this.saving()) {
      this.close();
    }
  }
}
