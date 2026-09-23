'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_get_authors()
      BEGIN
        SELECT a.*,
          (SELECT COUNT(*) FROM books b WHERE b.authorId = a.id) AS bookCount
        FROM authors a
        ORDER BY a.name;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_add_author(IN p_name VARCHAR(150), IN p_bio TEXT)
      BEGIN
        INSERT INTO authors (name, bio, createdAt, updatedAt)
        VALUES (p_name, p_bio, UTC_TIMESTAMP(), UTC_TIMESTAMP());

        SELECT * FROM authors WHERE id = LAST_INSERT_ID();
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

        -- author with books can't be deleted, we never cascade delete books
        SELECT COUNT(*) INTO total_books FROM books WHERE authorId = p_author_id;

        IF total_books > 0 THEN
          SET error_msg = CONCAT('Cannot delete author, ', total_books, ' book(s) are still linked to this author');
          SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 5002, MESSAGE_TEXT = error_msg;
        END IF;

        DELETE FROM authors WHERE id = p_author_id;
      END
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_get_authors');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_add_author');
    await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_delete_author');
  },
};
