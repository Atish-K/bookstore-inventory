const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

// used by the app and by sequelize-cli (.sequelizerc points to this file)
const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  // otherwise mysql2 returns DECIMAL (price) as a string
  dialectOptions: { decimalNumbers: true },
  // keeps track of seeders already run, so running seed again won't duplicate data
  seederStorage: 'sequelize',
};

module.exports = {
  development: {
    ...common,
    database: process.env.DB_NAME || 'bookstore_inventory',
  },
  test: {
    ...common,
    database: process.env.DB_NAME_TEST || 'bookstore_inventory_test',
  },
  production: {
    ...common,
    database: process.env.DB_NAME,
  },
};
