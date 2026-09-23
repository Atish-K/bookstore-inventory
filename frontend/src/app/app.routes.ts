import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'books', pathMatch: 'full' },
  {
    path: 'books',
    title: 'Books',
    loadComponent: () =>
      import('./features/books/book-list/book-list.component').then((m) => m.BookListComponent)
  },
  {
    path: 'books/new',
    title: 'Add book',
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then((m) => m.BookFormComponent)
  },
  { path: '**', redirectTo: 'books' }
];
