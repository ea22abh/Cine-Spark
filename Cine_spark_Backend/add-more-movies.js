/**
 * Adds 8 more movies to the database.
 * Run with: node add-more-movies.js
 *
 * Safe to re-run — duplicate titles are skipped.
 */
require('dotenv').config();
const { pool, testConnection } = require('./src/config/db');

const MOVIES = [
  {
    title: 'Captain America: Brave New World',
    description: 'Sam Wilson, the new Captain America, finds himself in the middle of an international incident and must discover the motive behind a nefarious global plot before the true mastermind plunges the world into chaos.',
    genre: 'Action/Superhero',
    duration: 118,
    language: 'English',
    release_date: '2025-02-14',
    poster_url: 'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/bIfTDIEFT0h3VzJHaDqBD6nMKYq.jpg',
    rating: 6.2,
    is_now_showing: 1,
  },
  {
    title: 'A Minecraft Movie',
    description: 'Four misfits find themselves transported to the Overworld, a strange cubical land of creativity and danger. To return home they must master the craft of survival and work with an unexpected expert crafter.',
    genre: 'Animation/Adventure',
    duration: 101,
    language: 'English',
    release_date: '2025-04-04',
    poster_url: 'https://image.tmdb.org/t/p/w500/sqFtHVH2YqfGBiC5qvGIBPJFTLR.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/hMVjSbhXCHWpPJSCXA0vGG5MHWF.jpg',
    rating: 7.3,
    is_coming_soon: 1,
  },
  {
    title: 'Snow White',
    description: "Disney's reimagining of the classic fairy tale follows a princess who, with the help of seven magical companions, must reclaim her kingdom from a wicked queen who seeks to destroy her.",
    genre: 'Fantasy/Musical',
    duration: 109,
    language: 'English',
    release_date: '2025-03-21',
    poster_url: 'https://image.tmdb.org/t/p/w500/oV96Wkv0KM5YT7HZHGcZhqHDODO.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg',
    rating: 6.0,
    is_coming_soon: 1,
  },
  {
    title: 'Sonic the Hedgehog 3',
    description: 'Sonic, Knuckles and Tails reunite against a powerful new adversary — Shadow the Hedgehog, a mysterious villain with powers beyond anything they have ever faced before.',
    genre: 'Action/Comedy',
    duration: 109,
    language: 'English',
    release_date: '2024-12-20',
    poster_url: 'https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/7ZRiuY0tYfFJqGa5u4VlmOVwbla.jpg',
    rating: 7.3,
    is_now_showing: 1,
  },
  {
    title: 'Mufasa: The Lion King',
    description: 'A prequel exploring how Mufasa rose from a lost cub to become the legendary king of the Pride Lands, told through the stories of Simba to his own cub.',
    genre: 'Animation/Drama',
    duration: 118,
    language: 'English',
    release_date: '2024-12-20',
    poster_url: 'https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/fqEgKGqhJpV9QXhuFHv9KGZP4Hw.jpg',
    rating: 7.2,
    is_now_showing: 1,
  },
  {
    title: 'Nosferatu',
    description: "A gothic tale of obsession between a haunted young woman in 19th century Germany and the ancient Transylvanian vampire who stalks her, bringing untold horror to her family.",
    genre: 'Horror/Drama',
    duration: 132,
    language: 'English',
    release_date: '2024-12-25',
    poster_url: 'https://image.tmdb.org/t/p/w500/5qGIxdEO841C0tdY8vOdLoRVrr0.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/iAiMiRoYBhElBX6ENkzJjuFuPjI.jpg',
    rating: 7.6,
    is_now_showing: 1,
  },
  {
    title: 'The Substance',
    description: "A fading celebrity uses a black market drug to generate a younger, more beautiful version of herself — with increasingly disturbing consequences as both versions fight to exist.",
    genre: 'Horror/Sci-Fi',
    duration: 141,
    language: 'English',
    release_date: '2024-09-06',
    poster_url: 'https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729d6qzt349fB4o.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/6IVBkpEkLSIbxNnqvvFkh5eS0GO.jpg',
    rating: 7.2,
    is_now_showing: 1,
  },
];

const SHOW_TIMES = ['10:30:00', '13:00:00', '16:30:00', '20:00:00'];
const PRICE = 12.50;

function getNextNDays(n) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const run = async () => {
  await testConnection();

  console.log('\n── New Movies ──────────────────────────────────');
  const newMovieIds = [];
  for (const movie of MOVIES) {
    const [existing] = await pool.query('SELECT id FROM movies WHERE title = ?', [movie.title]);
    if (existing.length > 0) {
      console.log(`  Exists  : ${movie.title}`);
      newMovieIds.push(existing[0].id);
      continue;
    }
    const [result] = await pool.query(
      `INSERT INTO movies
        (title, description, genre, duration, language, release_date, poster_url, backdrop_url,
         rating, is_active, is_featured, is_premiere, is_now_showing, is_coming_soon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)`,
      [
        movie.title, movie.description, movie.genre, movie.duration, movie.language,
        movie.release_date, movie.poster_url, movie.backdrop_url || null, movie.rating,
        movie.is_featured ? 1 : 0,
        movie.is_featured ? 1 : 0,   // is_premiere mirrors is_featured
        movie.is_now_showing ? 1 : 0,
        movie.is_coming_soon ? 1 : 0,
      ]
    );
    console.log(`  Created : ${movie.title} (id=${result.insertId})`);
    newMovieIds.push(result.insertId);
  }

  // Find an existing screen to add showtimes
  const [screens] = await pool.query('SELECT id, name FROM screens LIMIT 1');
  if (screens.length === 0) {
    console.log('\n⚠  No screens found — run seed-movies.js first to create a screen.');
    process.exit(0);
  }
  const screenId = screens[0].id;
  console.log(`\n── Showtimes (screen: ${screens[0].name}) ─────────`);

  const dates = getNextNDays(7);
  let created = 0, skipped = 0;
  for (const movieId of newMovieIds) {
    for (const date of dates) {
      for (const time of SHOW_TIMES) {
        const [existing] = await pool.query(
          'SELECT id FROM showtimes WHERE movie_id = ? AND screen_id = ? AND show_date = ? AND show_time = ?',
          [movieId, screenId, date, time]
        );
        if (existing.length > 0) { skipped++; continue; }
        await pool.query(
          'INSERT INTO showtimes (movie_id, screen_id, show_date, show_time, price, available_seats) VALUES (?, ?, ?, ?, ?, ?)',
          [movieId, screenId, date, time, PRICE, 50]
        );
        created++;
      }
    }
  }
  console.log(`  Created ${created} showtimes, skipped ${skipped} (already existed)`);

  console.log('\n✓ Done! 8 new movies added. Refresh the frontend to see them.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
