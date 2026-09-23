const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().label('Author id'),
});

const addAuthorSchema = Joi.object({
  name: Joi.string().trim().max(150).required().label('Name'),
  // empty bio is saved as null
  bio: Joi.string().trim().max(2000).empty('').allow(null).default(null).label('Bio'),
});

module.exports = { idParam, addAuthorSchema };
