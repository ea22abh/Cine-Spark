/**
 * Updates admin credentials.
 * Run with: npm run update:admin
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./src/config/db');

const NEW_EMAIL = 'admin@gmail.com';
const NEW_PASSWORD = 'admin@123';

const run = async () => {
  await testConnection();

  const [admins] = await pool.query("SELECT id, email FROM users WHERE role = 'admin'");
  if (admins.length === 0) {
    console.log('No admin user found. Run npm run seed first.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
  await pool.query(
    "UPDATE users SET email = ?, password = ? WHERE role = 'admin'",
    [NEW_EMAIL, hashed]
  );

  console.log('Admin credentials updated:');
  console.log('  Email   :', NEW_EMAIL);
  console.log('  Password:', NEW_PASSWORD);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
