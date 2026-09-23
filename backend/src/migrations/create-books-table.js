'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.createTable('books', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      isbn: {
        // saved without hyphens, so max 13 chars
        type: Sequelize.STRING(13),
        allowNull: false,
        unique: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'authors', key: 'id' },
        onUpdate: 'CASCADE',
        // RESTRICT so books never get deleted along with the author
        onDelete: 'RESTRICT',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // API also validates these, this is just extra safety at DB level
    await queryInterface.addConstraint('books', {
      type: 'check',
      name: 'books_price_positive',
      fields: ['price'],
      where: { price: { [Op.gt]: 0 } },
    });

    await queryInterface.addConstraint('books', {
      type: 'check',
      name: 'books_stock_not_negative',
      fields: ['stock'],
      where: { stock: { [Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('books');
  },
};
