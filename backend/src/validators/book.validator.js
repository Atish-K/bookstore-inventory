const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().label('Book id'),
});

const addBookSchema = Joi.object({
  title: Joi.string().trim().max(255).required().label('Title'),
  // hyphens and spaces are removed, so 978-0-14-303965-5 and 9780143039655 are the same isbn
  isbn: Joi.string()
    .replace(/[-\s]/g, '')
    .uppercase()
    .pattern(/^(\d{9}[\dX]|\d{13})$/)
    .required()
    .label('ISBN')
    .messages({ 'string.pattern.base': 'ISBN must have 10 or 13 digits' }),
  price: Joi.number().greater(0).max(99999999.99).precision(2).required().label('Price'),
  stock: Joi.number().integer().min(0).max(100000).default(0).label('Stock'),
  authorId: Joi.number().integer().positive().required().label('Author'),
});

const bookFilterSchema = Joi.object({
  inStock: Joi.boolean(),
  minPrice: Joi.number().min(0),
});

const updateStockSchema = Joi.object({
  change: Joi.number()
    .integer()
    .min(-100000)
    .max(100000)
    .invalid(0)
    .required()
    .label('Change')
    .messages({ 'any.invalid': 'Change cannot be 0' }),
});

module.exports = { idParam, addBookSchema, bookFilterSchema, updateStockSchema };
