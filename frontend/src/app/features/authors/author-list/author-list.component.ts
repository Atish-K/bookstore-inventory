import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { AuthorListItem } from '../../../core/models/author.model';
import { AuthorService } from '../../../core/services/author.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { avatarColors, initials } from '../../../shared/utils/colors';

@Component({
  selector: 'app-author-list',
  imports: [RouterLink, IconComponent],
  templateUrl: './author-list.component.html',
  styleUrl: './author-list.component.css'
})
export class AuthorListComponent implements OnInit {
  private authorService = inject(AuthorService);

  authors = signal<AuthorListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  search = signal('');

  visibleAuthors = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.authors();
    }
    return this.authors().filter(
      (author) => author.name.toLowerCase().includes(term) || (author.bio ?? '').toLowerCase().includes(term)
    );
  });

  stats = computed(() => {
    const authors = this.authors();
    return {
      authors: authors.length,
      books: authors.reduce((total, author) => total + author.bookCount, 0),
      withoutBooks: authors.filter((author) => author.bookCount === 0).length
    };
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.authorService.getAuthors().subscribe({
      next: (authors) => {
        this.authors.set(authors);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  avatar(author: AuthorListItem) {
    return avatarColors(author.id);
  }

  initials(name: string) {
    return initials(name);
  }
}
