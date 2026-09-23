import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiError } from '../../../core/models/api.model';
import { AuthorWithBooks } from '../../../core/models/author.model';
import { Book } from '../../../core/models/book.model';
import { AuthorService } from '../../../core/services/author.service';
import { ToastService } from '../../../core/services/toast.service';
import { BookTableComponent } from '../../../shared/components/book-table/book-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { avatarColors, initials } from '../../../shared/utils/colors';

@Component({
  selector: 'app-author-detail',
  imports: [RouterLink, CurrencyPipe, DecimalPipe, IconComponent, BookTableComponent, ConfirmDialogComponent],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.css'
})
export class AuthorDetailComponent {
  private authorService = inject(AuthorService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // :id from the url, set by the router (withComponentInputBinding in app.config.ts)
  id = input.required<string>();

  author = signal<AuthorWithBooks | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  confirmingDelete = signal(false);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  stats = computed(() => {
    const books = this.author()?.books ?? [];
    return {
      books: books.length,
      units: books.reduce((total, book) => total + book.stock, 0),
      value: books.reduce((total, book) => total + book.price * book.stock, 0)
    };
  });

  private request?: Subscription;

  constructor() {
    // runs on first load and again when the id in the url changes
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  load(id = Number(this.id())) {
    this.loading.set(true);
    this.error.set(null);

    this.request?.unsubscribe();
    this.request = this.authorService.getAuthor(id).subscribe({
      next: (author) => {
        this.author.set(author);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.author.set(null);
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  onStockChanged(updated: Book) {
    this.author.update((author) =>
      author ? { ...author, books: author.books.map((book) => (book.id === updated.id ? updated : book)) } : author
    );
  }

  openDelete() {
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
  }

  // the api refuses if the author still has books, we show its message in the dialog
  deleteAuthor() {
    const author = this.author();
    if (!author) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.authorService.deleteAuthor(author.id).subscribe({
      next: () => {
        this.toast.success(`${author.name} was deleted`);
        this.router.navigate(['/authors']);
      },
      error: (err: ApiError) => {
        this.deleting.set(false);
        this.deleteError.set(err.message);
      }
    });
  }

  avatar(author: AuthorWithBooks) {
    return avatarColors(author.id);
  }

  initials(name: string) {
    return initials(name);
  }
}
