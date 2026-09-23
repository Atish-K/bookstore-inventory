const callProcedure = require('../utils/call-procedure');

async function getBooks({ inStock, minPrice }) {
  // null means the procedure skips that filter
  return callProcedure('sp_get_books', [inStock ?? null, minPrice ?? null]);
}

async function addBook({ title, isbn, price, stock, authorId }) {
  const [book] = await callProcedure('sp_add_book', [title, isbn, price, stock, authorId]);
  return book;
}

async function updateStock(id, change) {
  const [book] = await callProcedure('sp_update_book_stock', [id, change]);
  return book;
}

module.exports = { getBooks, addBook, updateStock };
