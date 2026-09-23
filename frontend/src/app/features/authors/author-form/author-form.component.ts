import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { AuthorService } from '../../../core/services/author.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { initials } from '../../../shared/utils/colors';
import { requiredText } from '../../../shared/validators/form-validators';

const NAME_MAX = 150;
const BIO_MAX = 2000;

@Component({
  selector: 'app-author-form',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './author-form.component.html',
  styleUrl: './author-form.component.css'
})
export class AuthorFormComponent {
  private fb = inject(NonNullableFormBuilder);
  private authorService = inject(AuthorService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly bioMax = BIO_MAX;

  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [requiredText, Validators.maxLength(NAME_MAX)]],
    bio: ['', Validators.maxLength(BIO_MAX)]
  });

  // live preview card next to the form
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  preview = computed(() => {
    const name = this.formValue().name?.trim() || 'Author name';
    return {
      name,
      initials: initials(name),
      bio: this.formValue().bio?.trim() || 'A short bio will show up here.'
    };
  });

  bioLength = computed(() => this.formValue().bio?.length ?? 0);

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, bio } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.authorService.addAuthor({ name: name.trim(), bio: bio.trim() || null }).subscribe({
      next: (author) => {
        this.toast.success(`${author.name} was added`);
        this.router.navigate(['/authors', author.id]);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.showApiError(err);
      }
    });
  }

  errorFor(name: 'name' | 'bio'): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['server']) return errors['server'];
    if (errors['required']) return 'Name is required';
    if (errors['maxlength']) {
      return `${name === 'name' ? 'Name' : 'Bio'} can have at most ${errors['maxlength'].requiredLength} characters`;
    }
    return 'Invalid value';
  }

  // same idea as the book form: field error under the field, anything else on top
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
