/**
 * Seed script — creates the first admin user.
 * Run once: node seed.js
 */
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./src/config/db');
const initDb = require('./src/config/initDb');
require('dotenv').config();

const ADMIN = {
  name: 'Admin',
  email: 'admin@cinespark.com',
  password: 'Admin@123',
};

const seed = async () => {
  await testConnection();
  await initDb();

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [ADMIN.email]);
  if (existing.length > 0) {
    console.log('Admin already exists:', ADMIN.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(ADMIN.password, 10);
  await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [ADMIN.name, ADMIN.email, hashed, 'admin']
  );

  console.log('Admin created successfully');
  console.log('  Email   :', ADMIN.email);
  console.log('  Password:', ADMIN.password);
  console.log('Change the password after first login!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
