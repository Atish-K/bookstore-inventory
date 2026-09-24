const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Author, Book, BookAuthor } = require('../../src/models');

async function createAuthor(name = 'Ruskin Bond') {
  const res = await request(app)
    .post('/api/authors')
    .send({ name, bio: 'Writes stories about the hills of Mussoorie.' });
  return res.body.data;
}

async function createBook(authorId, data = {}) {
  const res = await request(app)
    .post('/api/books')
    .send({
      title: 'The Blue Umbrella',
      isbn: '9788129107282',
      price: 150,
      stock: 2,
      authorId,
      ...data,
    });
  return res.body.data;
}

// start every test with empty tables
beforeEach(async () => {
  await Book.destroy({ where: {} });
  await Author.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('happy path', () => {
  test('create author, add book, get author with books, update stock', async () => {
    const authorRes = await request(app)
      .post('/api/authors')
      .send({ name: 'Ruskin Bond', bio: 'Writes stories about the hills of Mussoorie.' });

    expect(authorRes.status).toBe(201);
    const authorId = authorRes.body.data.id;

    const bookRes = await request(app).post('/api/books').send({
      title: 'The Blue Umbrella',
      isbn: '978-81-291-0728-2',
      price: 150,
      stock: 2,
      authorId,
    });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.isbn).toBe('9788129107282');
    // a single authorId (as in the requirements) still works
    expect(bookRes.body.data.authorIds).toEqual([authorId]);

    const getRes = await request(app).get(`/api/authors/${authorId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Ruskin Bond');
    expect(getRes.body.data.books).toHaveLength(1);
    expect(getRes.body.data.books[0]).toMatchObject({ title: 'The Blue Umbrella', price: 150, stock: 2 });

    const stockRes = await request(app)
      .patch(`/api/books/${bookRes.body.data.id}/stock`)
      .send({ change: 5 });

    expect(stockRes.status).toBe(200);
    expect(stockRes.body.data.stock).toBe(7);
  });
});

describe('validation', () => {
  test('rejects a book without title', async () => {
    const author = await createAuthor();

    const res = await request(app)
      .post('/api/books')
      .send({ isbn: '9788129107282', price: 150, authorId: author.id });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'Title is required', field: 'title' } });
    expect(await Book.count()).toBe(0);
  });

  test('rejects a price that is not greater than 0', async () => {
    const author = await createAuthor();

    const res = await request(app)
      .post('/api/books')
      .send({ title: 'The Blue Umbrella', isbn: '9788129107282', price: -10, authorId: author.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ message: 'Price must be greater than 0', field: 'price' });
  });

  test('rejects author without name', async () => {
    const res = await request(app).post('/api/authors').send({ bio: 'no name here' });

    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('name');
  });

  test('rejects a book for an author that does not exist', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Ghost Book', isbn: '9788129107282', price: 99, authorId: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ message: 'Author with id 999999 does not exist', field: 'authorIds' });
  });

  test('rejects a duplicate isbn', async () => {
    const author = await createAuthor();
    await createBook(author.id);

    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Another Book', isbn: '9788129107282', price: 200, authorId: author.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ message: 'A book with this ISBN already exists', field: 'isbn' });
  });
});

describe('stock update', () => {
  test('does not let stock go below zero and keeps the old value', async () => {
    const author = await createAuthor();
    const book = await createBook(author.id, { stock: 2 });

    const res = await request(app).patch(`/api/books/${book.id}/stock`).send({ change: -3 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'Stock cannot go below zero', field: 'stock' } });

    const saved = await Book.findByPk(book.id);
    expect(saved.stock).toBe(2);
  });

  test('concurrent updates never oversell', async () => {
    const author = await createAuthor();
    const book = await createBook(author.id, { stock: 3 });

    // 5 people try to buy 1 copy at the same time, only 3 copies exist
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).patch(`/api/books/${book.id}/stock`).send({ change: -1 }),
      ),
    );

    const statuses = results.map((res) => res.status).sort();
    expect(statuses).toEqual([200, 200, 200, 400, 400]);

    const saved = await Book.findByPk(book.id);
    expect(saved.stock).toBe(0);
  });

  test('returns 404 for a book that does not exist', async () => {
    const res = await request(app).patch('/api/books/999999/stock').send({ change: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Book not found');
  });
});

describe('book filters', () => {
  test('filters by inStock and minPrice', async () => {
    const author = await createAuthor();
    await createBook(author.id, { title: 'Cheap In Stock', isbn: '1111111111', price: 99, stock: 5 });
    await createBook(author.id, { title: 'Costly In Stock', isbn: '2222222222', price: 450, stock: 1 });
    await createBook(author.id, { title: 'Costly Sold Out', isbn: '3333333333', price: 500, stock: 0 });

    const inStock = await request(app).get('/api/books?inStock=true');
    expect(inStock.body.data.map((b) => b.title)).toEqual(['Cheap In Stock', 'Costly In Stock']);

    const soldOut = await request(app).get('/api/books?inStock=false');
    expect(soldOut.body.data.map((b) => b.title)).toEqual(['Costly Sold Out']);

    const both = await request(app).get('/api/books?inStock=true&minPrice=100');
    expect(both.body.data.map((b) => b.title)).toEqual(['Costly In Stock']);
  });
});

describe('delete author', () => {
  test('cannot delete an author who still has books', async () => {
    const author = await createAuthor();
    await createBook(author.id);

    const res = await request(app).delete(`/api/authors/${author.id}`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/cannot delete author/i);
    expect(await Author.findByPk(author.id)).not.toBeNull();
    expect(await Book.count()).toBe(1);
  });

  test('deletes an author without books', async () => {
    const author = await createAuthor();

    const res = await request(app).delete(`/api/authors/${author.id}`);

    expect(res.status).toBe(204);
    expect(await Author.findByPk(author.id)).toBeNull();
  });
});

describe('multiple authors', () => {
  test('a co-written book shows up for both authors', async () => {
    const kalam = await createAuthor('A. P. J. Abdul Kalam');
    const tiwari = await createAuthor('Arun Tiwari');

    const bookRes = await request(app)
      .post('/api/books')
      .send({ title: 'Wings of Fire', isbn: '9788173711466', price: 399, stock: 20, authorIds: [kalam.id, tiwari.id] });

    expect(bookRes.status).toBe(201);
    // first author is the main author
    expect(bookRes.body.data).toMatchObject({ authorId: kalam.id, authorIds: [kalam.id, tiwari.id] });

    for (const author of [kalam, tiwari]) {
      const res = await request(app).get(`/api/authors/${author.id}`);
      expect(res.body.data.books).toHaveLength(1);
      expect(res.body.data.books[0]).toMatchObject({ title: 'Wings of Fire', authorIds: [kalam.id, tiwari.id] });
    }

    const list = await request(app).get('/api/books');
    expect(list.body.data[0].authorIds).toEqual([kalam.id, tiwari.id]);
  });

  test('saves nothing when one of the authors does not exist', async () => {
    const author = await createAuthor();

    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Half Valid', isbn: '9788129107282', price: 150, authorIds: [author.id, 999999] });

    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('authorIds');
    expect(await Book.count()).toBe(0);
    expect(await BookAuthor.count()).toBe(0);
  });

  test('rejects the same author twice', async () => {
    const author = await createAuthor();

    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Twice', isbn: '9788129107282', price: 150, authorIds: [author.id, author.id] });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ message: 'The same author is selected twice', field: 'authorIds' });
  });

  test('a co-author cannot be deleted while linked to a book', async () => {
    const main = await createAuthor('A. P. J. Abdul Kalam');
    const coAuthor = await createAuthor('Arun Tiwari');
    await createBook(undefined, { authorIds: [main.id, coAuthor.id] });

    const res = await request(app).delete(`/api/authors/${coAuthor.id}`);

    expect(res.status).toBe(409);
    expect(await Author.findByPk(coAuthor.id)).not.toBeNull();
  });
});
