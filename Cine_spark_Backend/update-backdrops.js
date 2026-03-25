/**
 * One-time migration: sets backdrop_url for existing movies.
 * Run with: node update-backdrops.js
 */
require('dotenv').config();
const { pool, testConnection } = require('./src/config/db');

const BACKDROPS = [
  { title: 'Deadpool & Wolverine', backdrop_url: 'https://image.tmdb.org/t/p/w1280/ufpeVEM64uZHPpzzeiDNIAdaeOD.jpg' },
  { title: 'Dune: Part Two',       backdrop_url: 'https://image.tmdb.org/t/p/w1280/ylkdrn23p3gQcHx7ukIfuy2CkTE.jpg' },
  { title: 'Gladiator II',         backdrop_url: 'https://image.tmdb.org/t/p/w1280/4hvK1uenpT7VVClzoNqXanvgdjX.jpg' },
  { title: 'Wicked',               backdrop_url: 'https://image.tmdb.org/t/p/w1280/fyZ6SDUS4o9jp2EHxfZa3qS9ean.jpg' },
  { title: 'Inside Out 2',         backdrop_url: 'https://image.tmdb.org/t/p/w1280/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg' },
  { title: 'Alien: Romulus',       backdrop_url: 'https://image.tmdb.org/t/p/w1280/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg' },
  { title: 'Moana 2',              backdrop_url: 'https://image.tmdb.org/t/p/w1280/pMtQTEaQPGjvUqLiNJC9EWZJiFY.jpg' },
  { title: 'The Wild Robot',       backdrop_url: 'https://image.tmdb.org/t/p/w1280/oqP1qEZccpNRqCahManOguMBnHh.jpg' },
];

const run = async () => {
  await testConnection();

  console.log('Updating backdrop URLs...');
  for (const { title, backdrop_url } of BACKDROPS) {
    const [result] = await pool.query(
      'UPDATE movies SET backdrop_url = ? WHERE title = ?',
      [backdrop_url, title]
    );
    if (result.affectedRows > 0) {
      console.log(`  Updated : ${title}`);
    } else {
      console.log(`  Skipped : ${title} (not found in DB)`);
    }
  }

  console.log('\nDone! All backdrop URLs updated.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
