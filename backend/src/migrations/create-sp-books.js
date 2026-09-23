'use strict';

module.exports = {
  async up(queryInterface) {
    // NULL in a param means that filter is not applied
    // p_in_stock: 1 = stock > 0, 0 = out of stock
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_get_books(IN p_in_stock TINYINT, IN p_min_price DECIMAL(10, 2))
      BEGIN
        SELECT * FROM books
        WHERE (p_in_stock IS NULL
            OR (p_in_stock = 1 AND stock > 0)
            OR (p_in_stock = 0 AND stock = 0))
          AND (p_min_price IS NULL OR price >= p_min_price)
        ORDER BY title;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_add_book(
        IN p_title VARCHAR(255),
        IN p_isbn VARCHAR(13),
        IN p_price DECIMAL(10, 2),
        IN p_stock INT,
        IN p_author_id INT
      )
      BEGIN
        DECLARE error_msg VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM authors WHERE id = p_author_id) THEN
          SET error_msg = CONCAT('Author with id ', p_author_id, ' does not exist');
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5005, MESSAGE_TEXT = error_msg;
        END IF;

        IF EXISTS (SELECT 1 FROM books WHERE isbn = p_isbn) THEN
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5006, MESSAGE_TEXT = 'A book with this ISBN already exists';
        END IF;

        INSERT INTO books (title, isbn, price, stock, authorId, createdAt, updatedAt)
        VALUES (p_title, p_isbn, p_price, p_stock, p_author_id, UTC_TIMESTAMP(), UTC_TIMESTAMP());

        SELECT * FROM books WHERE id = LAST_INSERT_ID();
      END
    `);

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

        SELECT * FROM books WHERE id = p_book_id;
      END
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_get_books');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_add_book');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_update_book_stock');
  },
};
