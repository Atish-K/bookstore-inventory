'use strict';

const authors = [
  {
    name: 'R. K. Narayan',
    bio: 'Wrote about life in Malgudi, a small fictional town in South India. One of the first Indian authors writing in English to be read widely abroad.',
    books: [
      { title: 'Malgudi Days', isbn: '9780143039655', price: 299, stock: 8 },
      { title: 'The Guide', isbn: '9780143039648', price: 250, stock: 0 },
    ],
  },
  {
    name: 'Chetan Bhagat',
    bio: 'Studied at IIT Delhi and IIM Ahmedabad, worked as an investment banker and then moved to full time writing.',
    books: [
      { title: 'Five Point Someone', isbn: '9788129104595', price: 176, stock: 15 },
      { title: '2 States', isbn: '9788129115300', price: 195, stock: 4 },
    ],
  },
  {
    name: 'Amish Tripathi',
    bio: 'Banker turned author, best known for the Shiva Trilogy.',
    books: [{ title: 'The Immortals of Meluha', isbn: '9789380658742', price: 350, stock: 2 }],
  },
  {
    name: 'A. P. J. Abdul Kalam',
    bio: 'Aerospace scientist and the 11th President of India.',
    books: [{ title: 'Wings of Fire', isbn: '9788173711466', price: 399, stock: 20 }],
  },
  {
    name: 'Arundhati Roy',
    bio: 'Won the Booker Prize in 1997 for her first novel.',
    books: [{ title: 'The God of Small Things', isbn: '9780812979657', price: 499, stock: 6 }],
  },
  {
    // no books added for her yet, useful for testing the delete author flow
    name: 'Sudha Murty',
    bio: 'Engineer, teacher and writer. Her short stories are simple and very relatable.',
    books: [],
  },
];

module.exports = {
  // going through the same procedures as the API, so seed data follows the same rules
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    for (const { books, ...author } of authors) {
      const [created] = await sequelize.query('CALL sp_add_author(?, ?)', {
        replacements: [author.name, author.bio],
      });

      for (const book of books) {
        await sequelize.query('CALL sp_add_book(?, ?, ?, ?, ?)', {
          replacements: [book.title, book.isbn, book.price, book.stock, created.id],
        });
      }
    }
  },

  async down(queryInterface) {
    const isbns = authors.flatMap((author) => author.books.map((book) => book.isbn));

    await queryInterface.bulkDelete('books', { isbn: isbns });
    await queryInterface.bulkDelete('authors', { name: authors.map((author) => author.name) });
  },
};
