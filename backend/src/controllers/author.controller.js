const authorService = require('../services/author.service');

// no try/catch needed, express 5 sends errors from async handlers to the error middleware

async function getAuthors(req, res) {
  const authors = await authorService.getAuthors();
  res.json({ data: authors });
}

async function getAuthor(req, res) {
  const author = await authorService.getAuthorById(req.validated.params.id);
  res.json({ data: author });
}

async function addAuthor(req, res) {
  const author = await authorService.addAuthor(req.validated.body);
  res.status(201).json({ data: author });
}

async function deleteAuthor(req, res) {
  await authorService.deleteAuthor(req.validated.params.id);
  res.status(204).end();
}

module.exports = { getAuthors, getAuthor, addAuthor, deleteAuthor };
