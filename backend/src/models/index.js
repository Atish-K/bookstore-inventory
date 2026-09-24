const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const Author = require('./author.model')(sequelize);
const Book = require('./book.model')(sequelize);
const BookAuthor = require('./book-author.model')(sequelize);

// main author of a book (books.authorId)
Author.hasMany(Book, { foreignKey: 'authorId', as: 'mainBooks' });
Book.belongsTo(Author, { foreignKey: 'authorId', as: 'mainAuthor' });

// every author of a book, co-authors included (book_authors)
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'authorId', otherKey: 'bookId', as: 'books' });
Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'bookId', otherKey: 'authorId', as: 'authors' });

module.exports = { sequelize, Sequelize, Author, Book, BookAuthor };
