const express = require('express');
const bookController = require('../controllers/book.controller');
const validate = require('../middlewares/validate.middleware');
const {
  idParam,
  addBookSchema,
  bookFilterSchema,
  updateStockSchema,
} = require('../validators/book.validator');

const router = express.Router();

router.get('/', validate({ query: bookFilterSchema }), bookController.getBooks);
router.post('/', validate({ body: addBookSchema }), bookController.addBook);
router.patch(
  '/:id/stock',
  validate({ params: idParam, body: updateStockSchema }),
  bookController.updateStock,
);

module.exports = router;
