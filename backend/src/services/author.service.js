const { Author, Book } = require('../models');
const callProcedure = require('../utils/call-procedure');
const AppError = require('../utils/app-error');

async function getAuthors() {
  return callProcedure('sp_get_authors');
}

// only place where we use sequelize include instead of a procedure,
// author with books is loaded through the hasMany association
async function getAuthorById(id) {
  const author = await Author.findByPk(id, {
    include: [{ model: Book, as: 'books' }],
    order: [[{ model: Book, as: 'books' }, 'title', 'ASC']],
  });

  if (!author) {
    throw new AppError('Author not found', 404);
  }

  return author;
}

async function addAuthor({ name, bio }) {
  const [author] = await callProcedure('sp_add_author', [name, bio]);
  return author;
}

async function deleteAuthor(id) {
  await callProcedure('sp_delete_author', [id]);
}

module.exports = { getAuthors, getAuthorById, addAuthor, deleteAuthor };
