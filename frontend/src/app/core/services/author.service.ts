import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Author, AuthorListItem, AuthorWithBooks, NewAuthor } from '../models/author.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/authors`;

  getAuthors(): Observable<AuthorListItem[]> {
    return this.http
      .get<ApiResponse<AuthorListItem[]>>(this.apiUrl)
      .pipe(map((res) => res.data));
  }

  getAuthor(id: number): Observable<AuthorWithBooks> {
    return this.http
      .get<ApiResponse<AuthorWithBooks>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  addAuthor(author: NewAuthor): Observable<Author> {
    return this.http
      .post<ApiResponse<Author>>(this.apiUrl, author)
      .pipe(map((res) => res.data));
  }

  deleteAuthor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
