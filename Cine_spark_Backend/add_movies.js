/**
 * add_movies.js
 * Inserts 9 new movies and assigns them to sections.
 * Usage: node add_movies.js
 */

require('dotenv').config();
const { pool } = require('./src/config/db');

const newMovies = [
  // ── Featured + Now Showing ────────────────────────────────────────────────
  {
    title: 'Thunderbolts*',
    description: 'A group of Marvel\'s most unconventional antiheroes and reformed villains are brought together for a covert mission that forces them to decide what kind of people they truly want to be.',
    genre: 'Action/Superhero',
    duration: 127,
    language: 'English',
    release_date: '2025-05-02',
    poster_url: 'https://media.themoviedb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/jYCyTdPfgT01IOJWDnnetr9RDX6.jpg',
    rating: 7.4,
    is_featured: 1, is_now_showing: 1, is_coming_soon: 0,
  },
  {
    title: 'Lilo & Stitch',
    description: 'A young Hawaiian girl named Lilo forms an unlikely friendship with a creature she names Stitch, unaware that he is actually a dangerous escaped alien experiment.',
    genre: 'Comedy/Family',
    duration: 108,
    language: 'English',
    release_date: '2025-05-23',
    poster_url: 'https://image.tmdb.org/t/p/w500/ckQzKpQJO4ZQDCN5evdpKcfm7Ys.jpg',
    backdrop_url: 'https://media.themoviedb.org/t/p/w1280/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg',
    rating: 6.7,
    is_featured: 0, is_now_showing: 1, is_coming_soon: 0,
  },
  {
    title: 'How to Train Your Dragon',
    description: 'A young Viking who aspires to hunt dragons becomes the unlikely friend of a young dragon himself, and discovers there may be far more to these creatures than anyone assumed.',
    genre: 'Adventure/Family',
    duration: 124,
    language: 'English',
    release_date: '2025-06-13',
    poster_url: 'https://image.tmdb.org/t/p/w500/53dsJ3oEnBhTBVMigWJ9tkA5bzJ.jpg',
    backdrop_url: 'https://media.themoviedb.org/t/p/w1280/79PNOxNXSe5e0bhEj11QJPlsdCN.jpg',
    rating: 7.7,
    is_featured: 0, is_now_showing: 1, is_coming_soon: 0,
  },
  {
    title: 'Superman',
    description: 'Superman, a journalist in Metropolis, must reconcile his Kryptonian heritage with his human upbringing as Clark Kent, while facing a sinister threat orchestrated by billionaire Lex Luthor.',
    genre: 'Action/Superhero',
    duration: 129,
    language: 'English',
    release_date: '2025-07-11',
    poster_url: 'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/yRBc6WY3r1Fz5Cjd6DhSvzqunED.jpg',
    rating: 7.0,
    is_featured: 1, is_now_showing: 1, is_coming_soon: 0,
  },
  {
    title: 'Conclave',
    description: 'Following the death of the Pope, Cardinal Lawrence oversees the ancient ritual of a conclave to elect a new Pope, only to uncover a shocking conspiracy that threatens to shake the foundations of the Church.',
    genre: 'Drama/Thriller',
    duration: 120,
    language: 'English',
    release_date: '2024-10-25',
    poster_url: 'https://image.tmdb.org/t/p/w500/vYEyxF1UT779RiEalpMjUT6kfdf.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/eZzNdjNDvaSoyywy9ICg2UmFwul.jpg',
    rating: 7.4,
    is_featured: 0, is_now_showing: 1, is_coming_soon: 0,
  },
  {
    title: 'Anora',
    description: 'A young sex worker from Brooklyn gets her Cinderella moment when she impulsively marries the son of a Russian oligarch. When news reaches his parents, they move to have the marriage annulled.',
    genre: 'Romance/Drama',
    duration: 139,
    language: 'English',
    release_date: '2024-10-18',
    poster_url: 'https://image.tmdb.org/t/p/w500/cgXk2tNYhJZLXdBDO5DidAVzQ82.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/qvyOfwTC3qdbzkqdXWSSEMHtjBZ.jpg',
    rating: 7.3,
    is_featured: 0, is_now_showing: 1, is_coming_soon: 0,
  },

  // ── Coming Soon ───────────────────────────────────────────────────────────
  {
    title: 'Mission: Impossible – The Final Reckoning',
    description: 'Ethan Hunt and his IMF team race against time to stop a terrifying AI weapon known as The Entity before it falls into the wrong hands and brings global catastrophe.',
    genre: 'Action/Thriller',
    duration: 169,
    language: 'English',
    release_date: '2025-05-23',
    poster_url: 'https://media.themoviedb.org/t/p/w500/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/538U9snNc2fpnOmYXAPUh3zn31H.jpg',
    rating: 7.5,
    is_featured: 0, is_now_showing: 0, is_coming_soon: 1,
  },
  {
    title: 'Jurassic World Rebirth',
    description: 'Covert operative Zora Bennett leads a team on a dangerous mission to secure genetic material from the world\'s largest surviving dinosaurs, uncovering a sinister secret hidden from the world for decades.',
    genre: 'Action/Adventure',
    duration: 119,
    language: 'English',
    release_date: '2025-07-02',
    poster_url: 'https://image.tmdb.org/t/p/w500/6YPU9ijtI3GX6OG3QvkPoMFdVAB.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/zNriRTr0kWwyaXPzdg1EIxf0BWk.jpg',
    rating: 6.5,
    is_featured: 0, is_now_showing: 0, is_coming_soon: 1,
  },
  {
    title: 'The Fantastic Four: First Steps',
    description: 'In a retro-futuristic 1960s world, Marvel\'s First Family must balance their roles as heroes with the strength of their family bond while defending Earth from the planet-devouring cosmic being Galactus.',
    genre: 'Action/Superhero',
    duration: 115,
    language: 'English',
    release_date: '2025-07-25',
    poster_url: 'https://image.tmdb.org/t/p/w500/Ona6r0Aq8Gr41KBGztBibTyrYn.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/s94NjfKkcSczZ1FembwmQZwsuwY.jpg',
    rating: 6.8,
    is_featured: 0, is_now_showing: 0, is_coming_soon: 1,
  },
];

async function addMovies() {
  try {
    let inserted = 0;
    let skipped = 0;

    for (const movie of newMovies) {
      // Skip if title already exists
      const [existing] = await pool.query('SELECT id FROM movies WHERE title = ?', [movie.title]);
      if (existing.length > 0) {
        console.log(`⏭  Skipped (already exists): ${movie.title}`);
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO movies
          (title, description, genre, duration, language, release_date,
           poster_url, backdrop_url, rating, is_active,
           is_featured, is_now_showing, is_coming_soon)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          movie.title, movie.description, movie.genre, movie.duration,
          movie.language, movie.release_date, movie.poster_url, movie.backdrop_url,
          movie.rating, movie.is_featured, movie.is_now_showing, movie.is_coming_soon,
        ]
      );
      console.log(`✓  Added: ${movie.title}`);
      inserted++;
    }

    console.log(`\n── Summary ───────────────────────`);
    console.log(`   Inserted : ${inserted}`);
    console.log(`   Skipped  : ${skipped}`);

    // Section totals
    const [[{ featured }]] = await pool.query('SELECT COUNT(*) AS featured FROM movies WHERE is_featured=1');
    const [[{ now_showing }]] = await pool.query('SELECT COUNT(*) AS now_showing FROM movies WHERE is_now_showing=1');
    const [[{ coming_soon }]] = await pool.query('SELECT COUNT(*) AS coming_soon FROM movies WHERE is_coming_soon=1');

    console.log(`\n── Section Totals ────────────────`);
    console.log(`   Featured    : ${featured}`);
    console.log(`   Now Showing : ${now_showing}`);
    console.log(`   Coming Soon : ${coming_soon}`);
    console.log('\n✅ Done! Hard-refresh http://localhost:5173');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addMovies();
