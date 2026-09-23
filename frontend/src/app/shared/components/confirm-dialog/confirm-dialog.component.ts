import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

// "are you sure?" popup, the parent does the actual work and passes busy/error back in
@Component({
  selector: 'app-confirm-dialog',
  imports: [IconComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements AfterViewInit {
  title = input.required<string>();
  message = input.required<string>();
  confirmLabel = input('Confirm');
  busy = input(false);
  error = input<string | null>(null);

  confirmed = output<void>();
  closed = output<void>();

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }

  close() {
    if (!this.busy()) {
      this.dialog().nativeElement.close();
    }
  }

  // Esc key - don't allow closing while the request is running
  onCancel(event: Event) {
    if (this.busy()) {
      event.preventDefault();
    }
  }

  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
