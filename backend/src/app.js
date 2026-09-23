const express = require('express');
const authorRoutes = require('./routes/author.routes');
const bookRoutes = require('./routes/book.routes');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
