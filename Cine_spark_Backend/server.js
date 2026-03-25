const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const initDb = require('./src/config/initDb');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  await initDb();
  app.listen(PORT, () => {
    console.log(`CineSpark API running on http://localhost:${PORT}`);
  });
};

start();
