const bookService = require('../services/book.service');

async function getBooks(req, res) {
  const books = await bookService.getBooks(req.validated.query);
  res.json({ data: books });
}

async function addBook(req, res) {
  const book = await bookService.addBook(req.validated.body);
  res.status(201).json({ data: book });
}

async function updateStock(req, res) {
  const book = await bookService.updateStock(req.validated.params.id, req.validated.body.change);
  res.json({ data: book });
}

module.exports = { getBooks, addBook, updateStock };
