const { Author, Book } = require('../models');
const callProcedure = require('../utils/call-procedure');
const AppError = require('../utils/app-error');

async function getAuthors() {
  return callProcedure('sp_get_authors');
}

// only place where we use sequelize include instead of a procedure.
// books come through the book_authors association, so co-written books are included,
// and each book brings its author ids so the response looks like the other book endpoints
async function getAuthorById(id) {
  const author = await Author.findByPk(id, {
    include: [
      {
        model: Book,
        as: 'books',
        through: { attributes: [] },
        include: [{ model: Author, as: 'authors', attributes: ['id'], through: { attributes: [] } }],
      },
    ],
    order: [[{ model: Book, as: 'books' }, 'title', 'ASC']],
  });

  if (!author) {
    throw new AppError('Author not found', 404);
  }

  const { books, ...details } = author.toJSON();
  return {
    ...details,
    books: books.map(({ authors, ...book }) => ({ ...book, authorIds: mainAuthorFirst(book.authorId, authors) })),
  };
}

// same order as the procedures: main author, then the rest by id
function mainAuthorFirst(mainAuthorId, authors) {
  const others = authors.map((a) => a.id).filter((authorId) => authorId !== mainAuthorId);
  return [mainAuthorId, ...others.sort((a, b) => a - b)];
}

async function addAuthor({ name, bio }) {
  const [author] = await callProcedure('sp_add_author', [name, bio]);
  return author;
}

async function deleteAuthor(id) {
  await callProcedure('sp_delete_author', [id]);
}

module.exports = { getAuthors, getAuthorById, addAuthor, deleteAuthor };
