export interface Book {
  id: number;
  title: string;
  isbn: string;
  price: number;
  stock: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewBook {
  title: string;
  isbn: string;
  price: number;
  stock: number;
  authorId: number;
}

export interface BookFilters {
  inStock?: boolean;
  minPrice?: number;
}
