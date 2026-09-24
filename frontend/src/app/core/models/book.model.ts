export interface Book {
  id: number;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  // main author
  authorId: number;
  // every author of the book, main author first
  authorIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface NewBook {
  title: string;
  isbn: string;
  price: number;
  stock: number;
  // first one becomes the main author
  authorIds: number[];
}

export interface BookFilters {
  inStock?: boolean;
  minPrice?: number;
}
