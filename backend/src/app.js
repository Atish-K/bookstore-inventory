const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const express = require('express');
const cors = require('cors');
const authorRoutes = require('./routes/author.routes');
const bookRoutes = require('./routes/book.routes');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// frontend urls allowed to call the api, comma separated in .env
// eg. CORS_ORIGIN=http://localhost:4200,https://bookstore.example.com
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
