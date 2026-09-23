const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error(`Could not connect to the database: ${err.message}`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Bookstore API listening on http://localhost:${PORT}`);
  });
}

start();
