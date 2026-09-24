import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { AuthorListItem } from '../../../core/models/author.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { avatarColors, initials } from '../../../shared/utils/colors';
import { atLeastOne, greaterThan, isbn, requiredText, wholeNumber } from '../../../shared/validators/form-validators';

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, IconComponent],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css'
})
export class BookFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // from the query param, eg. /books/new?authorId=3 (opened from author page)
  authorId = input<string>();

  authors = signal<AuthorListItem[]>([]);
  authorsLoading = signal(false);
  authorsError = signal<string | null>(null);

  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [requiredText, Validators.maxLength(255)]],
    isbn: ['', [requiredText, isbn]],
    price: this.fb.control<number | null>(null, [Validators.required, greaterThan(0)]),
    stock: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), wholeNumber]),
    // first one is the main author, the rest are co-authors
    authorIds: this.fb.control<number[]>([], atLeastOne)
  });

  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  selectedAuthors = computed(() =>
    (this.formValue().authorIds ?? [])
      .map((id) => this.authors().find((author) => author.id === id))
      .filter((author): author is AuthorListItem => !!author)
  );

  // the dropdown only offers authors that are not picked yet
  availableAuthors = computed(() => {
    const picked = this.formValue().authorIds ?? [];
    return this.authors().filter((author) => !picked.includes(author.id));
  });

  // live preview card on the right side of the form
  preview = computed(() => {
    const value = this.formValue();
    const names = this.selectedAuthors().map((author) => author.name);
    return {
      title: value.title?.trim() || 'Book title',
      authors: names.length ? names.join(' & ') : 'Author name',
      price: value.price ?? null,
      stock: value.stock ?? 0
    };
  });

  ngOnInit() {
    const authorId = Number(this.authorId());
    if (authorId) {
      this.form.controls.authorIds.setValue([authorId]);
    }
    this.loadAuthors();
  }

  loadAuthors() {
    this.authorsLoading.set(true);
    this.authorsError.set(null);

    this.authorService.getAuthors().subscribe({
      next: (authors) => {
        this.authors.set(authors);
        this.authorsLoading.set(false);
      },
      error: (err: ApiError) => {
        this.authorsError.set(err.message);
        this.authorsLoading.set(false);
      }
    });
  }

  addAuthor(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    select.value = '';
    if (!id) {
      return;
    }

    const control = this.form.controls.authorIds;
    control.setValue([...control.value, id]);
    control.markAsTouched();
  }

  removeAuthor(id: number) {
    const control = this.form.controls.authorIds;
    control.setValue(control.value.filter((authorId) => authorId !== id));
    control.markAsTouched();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.bookService
      .addBook({
        title: value.title.trim(),
        isbn: value.isbn.trim(),
        price: value.price!,
        stock: value.stock!,
        authorIds: value.authorIds
      })
      .subscribe({
        next: (book) => {
          this.toast.success(`"${book.title}" was added`);
          this.router.navigate(['/books']);
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.showApiError(err);
        }
      });
  }

  errorFor(name: 'title' | 'isbn' | 'price' | 'stock' | 'authorIds'): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }

    const requiredMessages = {
      title: 'Title is required',
      isbn: 'ISBN is required',
      price: 'Price is required',
      stock: 'Stock is required',
      authorIds: 'Please select at least one author'
    };

    const errors = control.errors;
    if (errors['server']) return errors['server'];
    if (errors['required']) return requiredMessages[name];
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['isbn']) return 'ISBN must have 10 or 13 digits';
    if (errors['greaterThan']) return 'Price must be greater than 0';
    if (errors['min']) return 'Stock cannot be negative';
    if (errors['wholeNumber']) return 'Stock must be a whole number';
    return 'Invalid value';
  }

  avatar(authorId: number) {
    return avatarColors(authorId);
  }

  initials(name: string) {
    return initials(name);
  }

  // if the api says which field is wrong (eg. duplicate isbn) show it under that field,
  // otherwise show it on top of the form
  private showApiError(err: ApiError) {
    const control = err.field ? this.form.get(err.field) : null;

    if (control) {
      control.setErrors({ server: err.message });
      control.markAsTouched();
    } else {
      this.error.set(err.message);
    }
  }
}
