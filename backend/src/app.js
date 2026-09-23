const express = require('express');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.use(notFound);
app.use(errorHandler);

module.exports = app;
