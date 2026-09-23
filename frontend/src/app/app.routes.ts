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
  {
    path: 'authors',
    title: 'Authors',
    loadComponent: () =>
      import('./features/authors/author-list/author-list.component').then((m) => m.AuthorListComponent)
  },
  {
    // must be before authors/:id, otherwise "new" would be read as an id
    path: 'authors/new',
    title: 'Add author',
    loadComponent: () =>
      import('./features/authors/author-form/author-form.component').then((m) => m.AuthorFormComponent)
  },
  {
    // the component gets :id as an input and loads the author itself (see AuthorDetailComponent)
    path: 'authors/:id',
    title: 'Author',
    loadComponent: () =>
      import('./features/authors/author-detail/author-detail.component').then((m) => m.AuthorDetailComponent)
  },
  { path: '**', redirectTo: 'books' }
];
