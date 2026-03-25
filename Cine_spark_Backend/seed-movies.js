/**
 * Seed movies, screen, seats and showtimes.
 * Run with: npm run seed:movies
 *
 * Safe to re-run — duplicate movies/showtimes are skipped.
 */
require('dotenv').config();
const { pool, testConnection } = require('./src/config/db');
const initDb = require('./src/config/initDb');

const MOVIES = [
  {
    title: 'Deadpool & Wolverine',
    description: 'The Merc with a Mouth teams up with the legendary Wolverine in an explosive, multiverse-shattering adventure that changes the Marvel universe forever.',
    genre: 'Action/Comedy',
    duration: 128,
    language: 'English',
    release_date: '2024-07-26',
    poster_url: 'https://image.tmdb.org/t/p/w500/v0Q2uYARIqui1sEBF0bCLJaliDI.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/ufpeVEM64uZHPpzzeiDNIAdaeOD.jpg',
    rating: 8.1,
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
    genre: 'Sci-Fi/Adventure',
    duration: 166,
    language: 'English',
    release_date: '2024-03-01',
    poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/ylkdrn23p3gQcHx7ukIfuy2CkTE.jpg',
    rating: 8.5,
  },
  {
    title: 'Gladiator II',
    description: 'Years after witnessing the death of the legendary Maximus, Lucius is forced into the Colosseum and must look to his past to return power to the people of Rome.',
    genre: 'Action/Drama',
    duration: 148,
    language: 'English',
    release_date: '2024-11-22',
    poster_url: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/4hvK1uenpT7VVClzoNqXanvgdjX.jpg',
    rating: 7.2,
  },
  {
    title: 'Wicked',
    description: 'A spectacle-filled, joyous adventure following the unlikely friendship between Elphaba and Glinda in the Land of Oz, before one becomes the Wicked Witch of the West.',
    genre: 'Musical/Drama',
    duration: 160,
    language: 'English',
    release_date: '2024-11-22',
    poster_url: 'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/fyZ6SDUS4o9jp2EHxfZa3qS9ean.jpg',
    rating: 7.8,
  },
  {
    title: 'Inside Out 2',
    description: 'Follow Riley in her teenage years as new Emotions — led by anxious Anxiety — crowd into Headquarters, forcing the original Emotions to face how to coexist with their new friends.',
    genre: 'Animation/Comedy',
    duration: 96,
    language: 'English',
    release_date: '2024-06-14',
    poster_url: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
    rating: 7.7,
  },
  {
    title: 'Alien: Romulus',
    description: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    genre: 'Horror/Sci-Fi',
    duration: 119,
    language: 'English',
    release_date: '2024-08-16',
    poster_url: 'https://image.tmdb.org/t/p/w500/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
    rating: 7.4,
  },
  {
    title: 'Moana 2',
    description: 'Moana sets sail on an epic voyage to Motufetu, a legendary island hidden beneath the sea. With her crew and the demigod Maui, she faces a new challenge: an ancient deity named Nalo.',
    genre: 'Animation/Family',
    duration: 100,
    language: 'English',
    release_date: '2024-11-27',
    poster_url: 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/pMtQTEaQPGjvUqLiNJC9EWZJiFY.jpg',
    rating: 7.0,
  },
  {
    title: 'The Wild Robot',
    description: "After ROZZUM unit 7134 — Roz — is shipwrecked on a wild island, she must adapt to survive in harsh surroundings. Eventually she adopts an orphaned gosling.",
    genre: 'Animation/Drama',
    duration: 102,
    language: 'English',
    release_date: '2024-09-27',
    poster_url: 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/oqP1qEZccpNRqCahManOguMBnHh.jpg',
    rating: 8.3,
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

const seed = async () => {
  await testConnection();
  await initDb();

  console.log('\n── Movies ──────────────────────────────────');
  const movieIds = [];
  for (const movie of MOVIES) {
    const [existing] = await pool.query('SELECT id FROM movies WHERE title = ?', [movie.title]);
    if (existing.length > 0) {
      console.log(`  Exists  : ${movie.title}`);
      movieIds.push(existing[0].id);
      continue;
    }
    const [result] = await pool.query(
      'INSERT INTO movies (title, description, genre, duration, language, release_date, poster_url, backdrop_url, rating, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)',
      [movie.title, movie.description, movie.genre, movie.duration, movie.language, movie.release_date, movie.poster_url, movie.backdrop_url || null, movie.rating]
    );
    console.log(`  Created : ${movie.title} (id=${result.insertId})`);
    movieIds.push(result.insertId);
  }

  console.log('\n── Screen ──────────────────────────────────');
  let screenId;
  const [existingScreens] = await pool.query('SELECT id, name FROM screens LIMIT 1');
  if (existingScreens.length > 0) {
    screenId = existingScreens[0].id;
    console.log(`  Using existing screen: ${existingScreens[0].name} (id=${screenId})`);
  } else {
    const [screenResult] = await pool.query(
      'INSERT INTO screens (name, total_seats) VALUES (?, ?)',
      ['Screen 1', 50]
    );
    screenId = screenResult.insertId;
    console.log(`  Created screen: Screen 1 (id=${screenId})`);
  }

  console.log('\n── Seats ───────────────────────────────────');
  const [existingSeats] = await pool.query('SELECT COUNT(*) AS cnt FROM seats WHERE screen_id = ?', [screenId]);
  if (existingSeats[0].cnt === 0) {
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatData = [];
    for (const row of rows) {
      for (let n = 1; n <= 10; n++) {
        seatData.push([screenId, row, n, 'standard']);
      }
    }
    await pool.query(
      'INSERT IGNORE INTO seats (screen_id, row_label, seat_number, seat_type) VALUES ?',
      [seatData]
    );
    console.log(`  Generated 50 seats (rows A–E, 10 per row) for screen id=${screenId}`);
  } else {
    console.log(`  Seats already exist for screen id=${screenId} (${existingSeats[0].cnt} seats)`);
  }

  console.log('\n── Showtimes ────────────────────────────────');
  const dates = getNextNDays(7);
  let created = 0;
  let skipped = 0;
  for (const movieId of movieIds) {
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

  console.log('\n✓ Seed complete! Open the frontend to browse movies and book tickets.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
