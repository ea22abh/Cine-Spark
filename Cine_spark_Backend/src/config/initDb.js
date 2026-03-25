const { pool } = require('./db');

const initDb = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      genre VARCHAR(100),
      duration INT COMMENT 'in minutes',
      language VARCHAR(50),
      release_date DATE,
      poster_url VARCHAR(500),
      backdrop_url VARCHAR(500),
      rating DECIMAL(3,1) DEFAULT 0.0,
      is_active BOOLEAN DEFAULT TRUE,
      is_featured TINYINT(1) DEFAULT 0,
      is_premiere TINYINT(1) DEFAULT 0,
      is_now_showing TINYINT(1) DEFAULT 0,
      is_coming_soon TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS screens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      total_seats INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS showtimes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      movie_id INT NOT NULL,
      screen_id INT NOT NULL,
      show_date DATE NOT NULL,
      show_time TIME NOT NULL,
      price DECIMAL(8,2) NOT NULL,
      available_seats INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS seats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      screen_id INT NOT NULL,
      row_label VARCHAR(5) NOT NULL,
      seat_number INT NOT NULL,
      seat_type ENUM('standard', 'premium', 'vip') DEFAULT 'standard',
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
      UNIQUE KEY unique_seat (screen_id, row_label, seat_number)
    )`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      showtime_id INT NOT NULL,
      total_price DECIMAL(8,2) NOT NULL,
      status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed',
      booking_ref VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS booking_seats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      seat_id INT NOT NULL,
      showtime_id INT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
      FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
      UNIQUE KEY unique_seat_booking (seat_id, showtime_id)
    )`,
  ];

  for (const query of queries) {
    await pool.query(query);
  }

  // Add new columns to existing movies table if they don't exist
  const alterQueries = [
    `ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url VARCHAR(500)`,
    `ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0`,
    `ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_premiere TINYINT(1) DEFAULT 0`,
    `ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_now_showing TINYINT(1) DEFAULT 0`,
    `ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_coming_soon TINYINT(1) DEFAULT 0`,
  ];
  for (const q of alterQueries) {
    await pool.query(q).catch(() => {}); // ignore if column already exists
  }

  console.log('All tables created/verified successfully');

  // Auto-promote movies to featured if none are set (handles column migration case)
  const [[{ featuredCount }]] = await pool.query(
    'SELECT COUNT(*) AS featuredCount FROM movies WHERE is_featured = 1 AND is_active = 1'
  );
  if (Number(featuredCount) === 0) {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM movies WHERE is_active = 1');
    if (Number(total) > 0) {
      await pool.query(
        'UPDATE movies SET is_featured = 1, is_now_showing = 1 WHERE is_active = 1 ORDER BY id LIMIT 2'
      );
      console.log('Auto-promoted 2 movies to featured (migration fix)');
    }
  }

  // Seed sample data only on a fresh (empty) database
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM movies');
  if (Number(count) === 0) {
    await seedSampleData();
  }
};

const seedSampleData = async () => {
  // Insert a default screen
  const [screenResult] = await pool.query(
    `INSERT INTO screens (name, total_seats) VALUES (?, ?)`,
    ['Screen 1', 80]
  );
  const screenId = screenResult.insertId;

  // Generate seats for the screen (rows A–H, seats 1–10)
  const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatInserts = [];
  for (const row of seatRows) {
    for (let num = 1; num <= 10; num++) {
      const type = row <= 'B' ? 'vip' : row <= 'D' ? 'premium' : 'standard';
      seatInserts.push([screenId, row, num, type]);
    }
  }
  await pool.query(
    `INSERT INTO seats (screen_id, row_label, seat_number, seat_type) VALUES ?`,
    [seatInserts]
  );

  // Sample movies
  const movies = [
    {
      title: 'Interstellar: Redux',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      genre: 'Sci-Fi',
      duration: 169,
      language: 'English',
      release_date: '2025-11-07',
      poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&h=720&fit=crop',
      rating: 8.7,
      is_active: 1, is_featured: 1, is_premiere: 1, is_now_showing: 1, is_coming_soon: 0,
    },
    {
      title: 'The Dark Knight Returns',
      description: 'Gotham faces its greatest threat as Bruce Wayne dons the cape once more to battle a rising chaos.',
      genre: 'Action',
      duration: 152,
      language: 'English',
      release_date: '2025-12-15',
      poster_url: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1280&h=720&fit=crop',
      rating: 9.0,
      is_active: 1, is_featured: 1, is_premiere: 0, is_now_showing: 1, is_coming_soon: 0,
    },
    {
      title: 'Phantom Horizon',
      description: 'A breathtaking adventure across dimensions where reality bends and heroes are forged.',
      genre: 'Adventure',
      duration: 128,
      language: 'English',
      release_date: '2025-10-20',
      poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&h=720&fit=crop',
      rating: 7.5,
      is_active: 1, is_featured: 0, is_premiere: 0, is_now_showing: 1, is_coming_soon: 0,
    },
    {
      title: 'Neon Requiem',
      description: 'A neo-noir thriller set in a rain-soaked cyberpunk city where nothing is as it seems.',
      genre: 'Thriller',
      duration: 115,
      language: 'English',
      release_date: '2025-09-05',
      poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1280&h=720&fit=crop',
      rating: 7.8,
      is_active: 1, is_featured: 0, is_premiere: 0, is_now_showing: 1, is_coming_soon: 0,
    },
    {
      title: 'Starfall Chronicles',
      description: 'An epic space opera following the last alliance of planets against an ancient cosmic evil.',
      genre: 'Sci-Fi',
      duration: 145,
      language: 'English',
      release_date: '2026-03-28',
      poster_url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1280&h=720&fit=crop',
      rating: 0,
      is_active: 1, is_featured: 0, is_premiere: 0, is_now_showing: 0, is_coming_soon: 1,
    },
    {
      title: 'Echoes of Tomorrow',
      description: 'A time-travel drama where one scientist\'s discovery threatens to unravel the fabric of time itself.',
      genre: 'Drama',
      duration: 132,
      language: 'English',
      release_date: '2026-04-18',
      poster_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop',
      rating: 0,
      is_active: 1, is_featured: 0, is_premiere: 0, is_now_showing: 0, is_coming_soon: 1,
    },
    {
      title: 'Crimson Tide Rising',
      description: 'When a deadly storm merges with a supernatural force, a coastal town must band together to survive.',
      genre: 'Horror',
      duration: 108,
      language: 'English',
      release_date: '2026-05-09',
      poster_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop',
      backdrop_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1280&h=720&fit=crop',
      rating: 0,
      is_active: 1, is_featured: 0, is_premiere: 0, is_now_showing: 0, is_coming_soon: 1,
    },
  ];

  for (const m of movies) {
    const [movieResult] = await pool.query(
      `INSERT INTO movies (title, description, genre, duration, language, release_date,
        poster_url, backdrop_url, rating, is_active, is_featured, is_premiere, is_now_showing, is_coming_soon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.title, m.description, m.genre, m.duration, m.language, m.release_date,
       m.poster_url, m.backdrop_url, m.rating, m.is_active,
       m.is_featured, m.is_premiere, m.is_now_showing, m.is_coming_soon]
    );

    // Add showtimes for now-showing movies
    if (m.is_now_showing) {
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const times = ['11:00:00', '14:30:00', '18:00:00', '21:00:00'];
        for (const time of times) {
          await pool.query(
            `INSERT INTO showtimes (movie_id, screen_id, show_date, show_time, price, available_seats)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [movieResult.insertId, screenId, dateStr, time, 12.50, 80]
          );
        }
      }
    }
  }

  console.log('Sample data seeded successfully (7 movies, 1 screen, seats & showtimes)');
};

module.exports = initDb;
