const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Author',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    { tableName: 'authors' },
  );
