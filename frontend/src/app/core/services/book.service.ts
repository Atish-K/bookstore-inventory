import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Book, BookFilters, NewBook } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/books`;

  getBooks(filters: BookFilters = {}): Observable<Book[]> {
    let params = new HttpParams();

    if (filters.inStock !== undefined) {
      params = params.set('inStock', filters.inStock);
    }
    if (filters.minPrice !== undefined) {
      params = params.set('minPrice', filters.minPrice);
    }

    return this.http
      .get<ApiResponse<Book[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data));
  }

  addBook(book: NewBook): Observable<Book> {
    return this.http
      .post<ApiResponse<Book>>(this.apiUrl, book)
      .pipe(map((res) => res.data));
  }

  // change can be positive (add) or negative (remove)
  updateStock(id: number, change: number): Observable<Book> {
    return this.http
      .patch<ApiResponse<Book>>(`${this.apiUrl}/${id}/stock`, { change })
      .pipe(map((res) => res.data));
  }
}
