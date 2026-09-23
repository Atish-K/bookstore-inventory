import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { AuthorListItem } from '../../../core/models/author.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { greaterThan, isbn, requiredText, wholeNumber } from '../../../shared/validators/form-validators';

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css'
})
export class BookFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
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
    authorId: this.fb.control<number | null>(null, Validators.required)
  });

  ngOnInit() {
    const authorId = Number(this.authorId());
    if (authorId) {
      this.form.patchValue({ authorId });
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
        authorId: value.authorId!
      })
      .subscribe({
        next: () => this.router.navigate(['/books']),
        error: (err: ApiError) => {
          this.saving.set(false);
          this.showApiError(err);
        }
      });
  }

  errorFor(name: 'title' | 'isbn' | 'price' | 'stock' | 'authorId'): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['server']) return errors['server'];
    if (errors['required']) return 'This field is required';
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['isbn']) return 'ISBN must have 10 or 13 digits';
    if (errors['greaterThan']) return 'Price must be greater than 0';
    if (errors['min']) return 'Stock cannot be negative';
    if (errors['wholeNumber']) return 'Stock must be a whole number';
    return 'Invalid value';
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
