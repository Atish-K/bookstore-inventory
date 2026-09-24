# Bookstore Inventory

A small full-stack app to manage a bookstore's authors, books and stock.

- **Backend:** Node.js, Express 5, Sequelize, MySQL (stored procedures), Joi, Jest + Supertest
- **Frontend:** Angular 19 (standalone components, signals, reactive forms), plain CSS

What you can do in the app:

- add authors and books (with validation on both sides)
- see an author with all their books
- give a book more than one author (co-written books)
- search books and filter them by stock and minimum price
- add or remove stock, the API refuses anything that would take stock below 0
- delete an author, but only when they have no books left

---

## Project structure

```
bookstore-inventory/
├── backend/
│   ├── src/
│   │   ├── config/          database config (used by the app and sequelize-cli)
│   │   ├── migrations/      tables + stored procedures
│   │   ├── seeders/         sample authors and books
│   │   ├── models/          Author, Book, BookAuthor and their associations
│   │   ├── validators/      Joi schemas
│   │   ├── middlewares/     validation, 404 and the central error handler
│   │   ├── services/        data access (stored procedure calls, one Sequelize include)
│   │   ├── controllers/     thin request handlers
│   │   ├── routes/
│   │   ├── utils/           AppError, callProcedure()
│   │   ├── app.js
│   │   └── server.js
│   └── tests/integration/   API tests
└── frontend/
    └── src/app/
        ├── core/            models, api services, error interceptor, toast service
        ├── features/        books (list, form) and authors (list, detail, form)
        ├── shared/          book table, dialogs, icons, validators, colors
        ├── app.routes.ts
        └── app.config.ts
```

---

## Requirements

- Node.js 20 or newer
- MySQL 8 or MariaDB 10.4+ (XAMPP's MySQL works fine)

---

## Backend setup

```bash
cd backend
npm install
cp .env.example .env        # on Windows: copy .env.example .env
```

Update `.env` if your MySQL user or password is different:

```
PORT=3000
CORS_ORIGIN=http://localhost:4200
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bookstore_inventory
DB_NAME_TEST=bookstore_inventory_test
```

Create the database, run the migrations and add the sample data:

```bash
npm run db:create     # creates bookstore_inventory (utf8mb4)
npm run db:migrate    # tables + stored procedures
npm run db:seed       # 7 authors and 7 books, one of them co-written
```

Start the API:

```bash
npm run dev           # http://localhost:3000, restarts on file changes
# or
npm start
```

`npm run db:reset` undoes everything and runs migrations and seeders again, handy to get back to the sample data.

---

## Frontend setup

```bash
cd frontend
npm install
npm start             # http://localhost:4200
```

The API url comes from the Angular environment files:

- `src/environments/environment.development.ts` is used by `npm start` and points to `http://localhost:3000/api`
- `src/environments/environment.ts` is used by `npm run build`, set `apiUrl` there to the deployed backend

The backend only accepts requests from the urls in `CORS_ORIGIN`, so add the frontend url there when deploying.

---

## Running the tests

```bash
cd backend
npm test
```

`npm test` creates the `bookstore_inventory_test` database if needed and runs the migrations on it before Jest starts, so nothing else has to be set up. Every test starts with empty tables.

Covered:

- happy path: create author → add book → get author with books → update stock
- validation: missing title, price not above 0, missing author name, unknown `authorId`, duplicate ISBN
- stock: going below zero is rejected and the stored value does not change
- stock: 5 parallel `-1` requests on a book with 3 copies → exactly 3 succeed, 2 fail, stock ends at 0
- filters: `inStock` and `minPrice` alone and together
- delete: refused while the author has books, works when they have none
- multiple authors: a co-written book shows up for both authors, nothing is saved when one author id is wrong, the same author can't be added twice, a co-author can't be deleted

---

## API

Base url: `http://localhost:3000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/authors` | all authors with a `bookCount` |
| POST | `/authors` | create an author `{ name, bio? }` |
| GET | `/authors/:id` | author with all their books, co-written ones included (Sequelize `include`) |
| DELETE | `/authors/:id` | delete an author, `409` if they still have books |
| GET | `/books?inStock=true&minPrice=100` | list books, both filters are optional |
| POST | `/books` | create a book `{ title, isbn, price, stock?, authorIds: [4, 7] }`, a single `authorId: 4` also works |
| PATCH | `/books/:id/stock` | change stock by a signed amount `{ "change": -3 }` |

Filters on `GET /books`: `inStock=true` means stock > 0, `inStock=false` means stock = 0, and `minPrice=100` means price >= 100.

Books can have more than one author. The first id in `authorIds` is the main author. Every book in a response has `authorId` (main author) and `authorIds` (all authors, main author first).

Successful responses are wrapped in `data`:

```json
{ "data": { "id": 5, "title": "The Immortals of Meluha", "stock": 2 } }
```

Every error, from validation, business rules or anything unexpected, goes through one error middleware and has the same shape. `field` is only sent when the error belongs to an input:

```json
{ "error": { "message": "Stock cannot go below zero", "field": "stock" } }
```

| Status | When |
| --- | --- |
| 400 | validation failed, unknown author id, stock would go below zero |
| 404 | author / book / route not found |
| 409 | duplicate ISBN, deleting an author who still has books |
| 500 | anything unexpected (logged on the server, generic message to the client) |

---

## Database

Tables are created by migrations only, `sequelize.sync()` is never used.

- `authors`: `id`, `name`, `bio`, timestamps
- `books`: `id`, `title`, `isbn` (unique), `price` DECIMAL(10,2), `stock` (default 0), `authorId` → `authors.id` (main author), timestamps
- `book_authors`: `bookId`, `authorId`, one row for every author of a book (main author included)
- CHECK constraints: `price > 0`, `stock >= 0`
- the foreign keys to `authors` are `ON DELETE RESTRICT`, so deleting an author never removes books

Migrations run in this order: `create-authors-table`, `create-books-table`, `create-sp-authors`, `create-sp-books`, `multiple-authors-per-book`. The last one adds `book_authors`, copies every existing `authorId` into it and updates the procedures, so an older database is upgraded with `npm run db:migrate`.

Stored procedures (created in `src/migrations/create-sp-*.js`, the book ones updated in `multiple-authors-per-book.js`):

| Procedure | Used by |
| --- | --- |
| `sp_get_authors` | GET /authors |
| `sp_add_author` | POST /authors |
| `sp_delete_author` | DELETE /authors/:id |
| `sp_get_books` | GET /books |
| `sp_add_book` | POST /books |
| `sp_update_book_stock` | PATCH /books/:id/stock |

When a rule is broken the procedure raises `SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 500x`. `src/utils/call-procedure.js` maps those numbers to HTTP status codes:

| Code | Meaning | HTTP |
| --- | --- | --- |
| 5001 | author not found | 404 |
| 5002 | author still has books | 409 |
| 5003 | book not found | 404 |
| 5004 | stock would go below zero | 400 |
| 5005 | author of the new book does not exist | 400 |
| 5006 | ISBN already used | 409 |

---

## Frontend

Routes:

| Path | Page |
| --- | --- |
| `/books` | book list with search, stock filter, min price, quick +/- stock and a custom amount dialog |
| `/books/new` | add book form with one or more authors (`?authorId=3` preselects the author) |
| `/authors` | author list |
| `/authors/new` | add author form |
| `/authors/:id` | author detail with their books, add book and delete |

- every page is a standalone component and is lazy loaded
- HTTP calls only happen in `core/services`, components never use `HttpClient` directly
- API responses are typed with interfaces in `core/models`
- page state is kept in signals (`books`, `loading`, `error`), no state library
- `apiErrorInterceptor` turns every failed request into an `ApiError { message, status, field }`. Forms use `field` to show the message under the right input (for example a duplicate ISBN), and everything else is shown in an error box with a "Try again" button
- every request has a visible loading state (skeletons, "Saving..." buttons) and a visible error state

---

## Design decisions

1. All creates, updates, deletes and lists go through MySQL stored procedures, so the business rules (no negative stock, no deleting an author with books, author must exist) sit right next to the data. There is no inline SQL in the Node code.
2. The one exception is `GET /authors/:id`, which uses `Author.findByPk(id, { include: 'books' })` through a Sequelize association, because REQ-3.1 and REQ-4.3 ask for an association and include there. The schema, including the procedures, is created by migrations and not by `sequelize.sync()`.
3. `sp_update_book_stock` locks the book row with `SELECT ... FOR UPDATE` inside a transaction and rolls back on any error. Two requests at the same time are applied one after the other, and a rejected change never leaves a partial update. The concurrency test checks exactly this.
4. The procedures raise errors with custom `MYSQL_ERRNO` values, and `callProcedure()` turns them into HTTP responses in one place. The central error middleware then keeps every error in the same `{ error: { message, field } }` format.
5. Validation runs on both sides: Joi on the API is the source of truth, and the Angular forms repeat the same rules so users get quick feedback. For stock, the UI does not block a change that would go negative. It sends the request and shows the API's message, because only the server knows the current stock.
6. ISBNs are stored without hyphens and spaces, so `978-81-7371-146-6` and `9788173711466` count as the same book for the unique check.
7. **Multi-author books (REQ-3.2):** the document refers to REQ-3.2 but doesn't include it, so I read it as "a book can have more than one author" and built it without breaking the data model that is written down. `books.authorId` stays as the main author (with `Author.hasMany(Book)`), and a `book_authors` table lists every author of a book, used through `belongsToMany`. `POST /books` takes `authorIds`, and the single `authorId` from the spec still works. The delete rule looks at `book_authors`, so co-authors are protected too. It was added as a new migration, so existing databases are upgraded instead of rebuilt.
8. For route-level data loading (REQ-5.7) the author page receives `:id` as a component input (`withComponentInputBinding`) and fetches the author itself, instead of using a resolver. That way the page can show its own skeleton and error state, and navigation isn't blocked while the request runs.
9. The frontend reaches the API through environment files and CORS (`CORS_ORIGIN`) instead of a dev-server proxy, so the same setup works locally and when deployed.

---

## Not done (out of scope)

- authentication
- editing or deleting books, editing authors (not part of the requirements)
- pagination on the lists
