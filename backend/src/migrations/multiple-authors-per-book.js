'use strict';

// A book can have more than one author (REQ-3.2).
// books.authorId stays as the main author, book_authors has every author of a book
// (main author included), so "all books of an author" only has to look at one table.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('book_authors', {
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'books', key: 'id' },
        onUpdate: 'CASCADE',
        // the link belongs to the book, if a book row goes its links go too
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'authors', key: 'id' },
        onUpdate: 'CASCADE',
        // an author who is still linked to a book can't be deleted
        onDelete: 'RESTRICT',
      },
    });

    // existing books get their current author as the first link
    await queryInterface.sequelize.query(`
      INSERT INTO book_authors (bookId, authorId)
      SELECT id, authorId FROM books
    `);

    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_get_authors');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_delete_author');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_get_books');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_add_book');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_update_book_stock');

    // bookCount now also counts books the author co-wrote
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_get_authors()
      BEGIN
        SELECT a.*,
          (SELECT COUNT(*) FROM book_authors ba WHERE ba.authorId = a.id) AS bookCount
        FROM authors a
        ORDER BY a.name;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_delete_author(IN p_author_id INT)
      BEGIN
        DECLARE total_books INT DEFAULT 0;
        DECLARE error_msg VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM authors WHERE id = p_author_id) THEN
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5001, MESSAGE_TEXT = 'Author not found';
        END IF;

        -- counts books where they are the main author or a co-author
        SELECT COUNT(*) INTO total_books FROM book_authors WHERE authorId = p_author_id;

        IF total_books > 0 THEN
          SET error_msg = CONCAT('Cannot delete author, ', total_books, ' book(s) are still linked to this author');
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5002, MESSAGE_TEXT = error_msg;
        END IF;

        DELETE FROM authors WHERE id = p_author_id;
      END
    `);

    // authorIds comes back as text like "4,7", main author first
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_get_books(IN p_in_stock TINYINT, IN p_min_price DECIMAL(10, 2))
      BEGIN
        SELECT b.*,
          (SELECT GROUP_CONCAT(ba.authorId ORDER BY ba.authorId = b.authorId DESC, ba.authorId)
           FROM book_authors ba WHERE ba.bookId = b.id) AS authorIds
        FROM books b
        WHERE (p_in_stock IS NULL
            OR (p_in_stock = 1 AND b.stock > 0)
            OR (p_in_stock = 0 AND b.stock = 0))
          AND (p_min_price IS NULL OR b.price >= p_min_price)
        ORDER BY b.title;
      END
    `);

    // p_author_ids is a comma separated list like "4,7", the first one is the main author
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_add_book(
        IN p_title VARCHAR(255),
        IN p_isbn VARCHAR(13),
        IN p_price DECIMAL(10, 2),
        IN p_stock INT,
        IN p_author_ids VARCHAR(255)
      )
      BEGIN
        DECLARE new_book_id INT;
        DECLARE main_author_id INT;
        DECLARE ids_left VARCHAR(255);
        DECLARE next_id INT;
        DECLARE error_msg VARCHAR(255);

        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;

        -- every author in the list must exist
        SET ids_left = p_author_ids;
        WHILE ids_left <> '' DO
          SET next_id = SUBSTRING_INDEX(ids_left, ',', 1);

          IF NOT EXISTS (SELECT 1 FROM authors WHERE id = next_id) THEN
            SET error_msg = CONCAT('Author with id ', next_id, ' does not exist');
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5005, MESSAGE_TEXT = error_msg;
          END IF;

          SET ids_left = IF(LOCATE(',', ids_left) > 0, SUBSTRING(ids_left, LOCATE(',', ids_left) + 1), '');
        END WHILE;

        IF EXISTS (SELECT 1 FROM books WHERE isbn = p_isbn) THEN
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5006, MESSAGE_TEXT = 'A book with this ISBN already exists';
        END IF;

        SET main_author_id = SUBSTRING_INDEX(p_author_ids, ',', 1);

        -- book and its author links are saved together or not at all
        START TRANSACTION;

        INSERT INTO books (title, isbn, price, stock, authorId, createdAt, updatedAt)
        VALUES (p_title, p_isbn, p_price, p_stock, main_author_id, UTC_TIMESTAMP(), UTC_TIMESTAMP());

        SET new_book_id = LAST_INSERT_ID();

        INSERT INTO book_authors (bookId, authorId)
        SELECT new_book_id, id FROM authors WHERE FIND_IN_SET(id, p_author_ids);

        COMMIT;

        SELECT b.*,
          (SELECT GROUP_CONCAT(ba.authorId ORDER BY ba.authorId = b.authorId DESC, ba.authorId)
           FROM book_authors ba WHERE ba.bookId = b.id) AS authorIds
        FROM books b
        WHERE b.id = new_book_id;
      END
    `);

    // same as before, only the SELECT at the end also returns authorIds
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_update_book_stock(IN p_book_id INT, IN p_change INT)
      BEGIN
        DECLARE current_stock INT;

        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;

        START TRANSACTION;

        -- FOR UPDATE locks the row, so if two requests come at the same time
        -- the second one waits and reads the updated stock
        SELECT stock INTO current_stock FROM books WHERE id = p_book_id FOR UPDATE;

        IF current_stock IS NULL THEN
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5003, MESSAGE_TEXT = 'Book not found';
        END IF;

        IF current_stock + p_change < 0 THEN
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5004, MESSAGE_TEXT = 'Stock cannot go below zero';
        END IF;

        UPDATE books
        SET stock = current_stock + p_change, updatedAt = UTC_TIMESTAMP()
        WHERE id = p_book_id;

        COMMIT;

        SELECT b.*,
          (SELECT GROUP_CONCAT(ba.authorId ORDER BY ba.authorId = b.authorId DESC, ba.authorId)
           FROM book_authors ba WHERE ba.bookId = b.id) AS authorIds
        FROM books b
        WHERE b.id = p_book_id;
      END
    `);
  },

  // put back the procedures from the earlier migrations, then remove the link table
  async down(queryInterface) {
    const procedures = ['sp_get_authors', 'sp_add_author', 'sp_delete_author', 'sp_get_books', 'sp_add_book', 'sp_update_book_stock'];
    for (const name of procedures) {
      await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS ${name}`);
    }

    await require('./create-sp-authors').up(queryInterface);
    await require('./create-sp-books').up(queryInterface);

    await queryInterface.dropTable('book_authors');
  },
};
