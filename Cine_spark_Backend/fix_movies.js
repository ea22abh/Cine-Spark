/**
 * fix_movies.js
 * Run once from Cine_spark_Backend/ to set section flags and fix backdrop URLs.
 * Usage: node fix_movies.js
 */

require('dotenv').config();
const { pool } = require('./src/config/db');

async function fixMovies() {
  try {
    // 1. Reset all flags, activate all movies
    await pool.query(`
      UPDATE movies
      SET is_active = 1, is_featured = 0, is_now_showing = 0, is_coming_soon = 0
    `);
    console.log('✓ Reset all section flags');

    // 2. Fill missing backdrop URLs
    const backdrops = [
      { id: 8,  url: 'https://image.tmdb.org/t/p/w1280/uIk2g2bRkNwNywKZIhC5oIU94Kh.jpg' }, // The Wild Robot
      { id: 14, url: 'https://image.tmdb.org/t/p/w1280/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg' }, // Sonic 3
      { id: 15, url: 'https://image.tmdb.org/t/p/w1280/1w8kutrRucTd3wlYyu5QlUDMiG1.jpg' }, // Mufasa
      { id: 16, url: 'https://image.tmdb.org/t/p/w1280/fYnEbgoNCxW9kL0IgOgtJb9JTBU.jpg' }, // Nosferatu
      { id: 17, url: 'https://image.tmdb.org/t/p/w1280/9Whl7RAzes0oMaFAeSqD8ttN3fl.jpg' }, // The Substance
    ];
    for (const { id, url } of backdrops) {
      await pool.query('UPDATE movies SET backdrop_url = ? WHERE id = ?', [url, id]);
    }
    console.log('✓ Filled missing backdrop URLs for 5 movies');

    // 3. Set is_featured = 1 (hero carousel: 4 most recent blockbusters)
    await pool.query(`
      UPDATE movies SET is_featured = 1
      WHERE id IN (10, 11, 12, 13)
    `);
    console.log('✓ Set featured: Cap America BNW, Minecraft, Snow White');

    // 4. Set is_now_showing = 1
    await pool.query(`
      UPDATE movies SET is_now_showing = 1
      WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15)
    `);
    console.log('✓ Set now_showing: 14 movies');

    // 5. Set is_coming_soon = 1
    await pool.query(`
      UPDATE movies SET is_coming_soon = 1
      WHERE id IN (16, 17)
    `);
    console.log('✓ Set coming_soon: Nosferatu, The Substance');

    // 6. Print summary
    const [rows] = await pool.query(`
      SELECT id, title, is_active, is_featured, is_now_showing, is_coming_soon
      FROM movies ORDER BY id
    `);

    console.log('\n── Movie Sections ────────────────────────────────────────');
    console.log('ID  | Active | Featured | Now Showing | Coming Soon | Title');
    console.log('----|--------|----------|-------------|-------------|------');
    for (const m of rows) {
      console.log(
        `${String(m.id).padEnd(3)} | ${m.is_active}      | ${m.is_featured}        | ${m.is_now_showing}           | ${m.is_coming_soon}           | ${m.title}`
      );
    }

    console.log('\n✅ Done! Hard-refresh http://localhost:5173 to see the changes.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixMovies();
