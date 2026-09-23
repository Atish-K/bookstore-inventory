const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Book',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isbn: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { tableName: 'books' },
  );
