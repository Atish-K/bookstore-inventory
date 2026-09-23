import { Book } from './book.model';

export interface Author {
  id: number;
  name: string;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /authors also sends how many books each author has
export interface AuthorListItem extends Author {
  bookCount: number;
}

// GET /authors/:id
export interface AuthorWithBooks extends Author {
  books: Book[];
}

export interface NewAuthor {
  name: string;
  bio: string | null;
}
