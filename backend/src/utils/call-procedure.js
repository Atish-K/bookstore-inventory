const { sequelize } = require('../models');
const AppError = require('./app-error');

// error numbers we raise inside the procedures with SIGNAL ... MYSQL_ERRNO
const procedureErrors = {
  5001: { status: 404 }, // author not found
  5002: { status: 409 }, // author still has books
  5003: { status: 404 }, // book not found
  5004: { status: 400, field: 'stock' }, // stock below zero
  5005: { status: 400, field: 'authorId' }, // author of new book doesn't exist
  5006: { status: 409, field: 'isbn' }, // duplicate isbn
};

// runs CALL sp_name(?, ?, ...) and returns the rows of the procedure's SELECT
async function callProcedure(name, params = []) {
  const placeholders = params.map(() => '?').join(', ');

  try {
    return await sequelize.query(`CALL ${name}(${placeholders})`, { replacements: params });
  } catch (err) {
    const known = procedureErrors[err.original?.errno];
    if (known) {
      throw new AppError(err.original.sqlMessage, known.status, known.field);
    }
    throw err;
  }
}

module.exports = callProcedure;
