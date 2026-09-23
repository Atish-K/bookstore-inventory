import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// small notifications shown in the bottom right corner (see ToastComponent)
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  dismiss(id: number) {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, type: Toast['type']) {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
