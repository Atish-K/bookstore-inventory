const callProcedure = require('../utils/call-procedure');

// the procedures return authorIds as text like "4,7", the api sends a real array
function toBook(row) {
  return { ...row, authorIds: row.authorIds ? row.authorIds.split(',').map(Number) : [] };
}

async function getBooks({ inStock, minPrice }) {
  // null means the procedure skips that filter
  const rows = await callProcedure('sp_get_books', [inStock ?? null, minPrice ?? null]);
  return rows.map(toBook);
}

// authorIds[0] is saved as the main author (books.authorId)
async function addBook({ title, isbn, price, stock, authorIds }) {
  const [book] = await callProcedure('sp_add_book', [title, isbn, price, stock, authorIds.join(',')]);
  return toBook(book);
}

async function updateStock(id, change) {
  const [book] = await callProcedure('sp_update_book_stock', [id, change]);
  return toBook(book);
}

module.exports = { getBooks, addBook, updateStock };
