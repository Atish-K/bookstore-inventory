const express = require('express');
const authorController = require('../controllers/author.controller');
const validate = require('../middlewares/validate.middleware');
const { idParam, addAuthorSchema } = require('../validators/author.validator');

const router = express.Router();

router.get('/', authorController.getAuthors);
router.post('/', validate({ body: addAuthorSchema }), authorController.addAuthor);
router.get('/:id', validate({ params: idParam }), authorController.getAuthor);
router.delete('/:id', validate({ params: idParam }), authorController.deleteAuthor);

module.exports = router;
