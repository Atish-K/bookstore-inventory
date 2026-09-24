import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// same rules as the joi schemas in the backend

// Validators.required allows "   ", backend trims it and rejects, so we do the same
export function requiredText(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  return value && value.trim() ? null : { required: true };
}

// for list values like the selected authors
export function atLeastOne(control: AbstractControl): ValidationErrors | null {
  const value = control.value as unknown[] | null;
  return value && value.length > 0 ? null : { required: true };
}

export function greaterThan(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }
    return Number(control.value) > min ? null : { greaterThan: { min } };
  };
}

export function wholeNumber(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === '') {
    return null;
  }
  return Number.isInteger(Number(control.value)) ? null : { wholeNumber: true };
}

// 10 or 13 digits, hyphens and spaces allowed (ISBN-10 can end with X)
export function isbn(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase();
  return /^(\d{9}[\dX]|\d{13})$/.test(cleaned) ? null : { isbn: true };
}
