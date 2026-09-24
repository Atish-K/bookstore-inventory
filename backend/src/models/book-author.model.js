const { DataTypes } = require('sequelize');

// link table between books and authors, one row per author of a book
module.exports = (sequelize) =>
  sequelize.define(
    'BookAuthor',
    {
      bookId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      authorId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    { tableName: 'book_authors', timestamps: false },
  );
