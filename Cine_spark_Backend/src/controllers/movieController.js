const { pool } = require('../config/db');

const SECTION_COLS = {
  featured:    'is_featured',
  premiere:    'is_premiere',
  now_showing: 'is_now_showing',
  coming_soon: 'is_coming_soon',
};

// GET /api/movies?section=featured|premiere|now_showing|coming_soon
const getAllMovies = async (req, res) => {
  try {
    const col = SECTION_COLS[req.query.section];
    if (col) {
      const [rows] = await pool.query(
        'SELECT * FROM movies WHERE ?? = 1 AND is_active = 1 ORDER BY release_date DESC',
        [col]
      );
      return res.json(rows);
    }
    const [rows] = await pool.query(
      'SELECT * FROM movies WHERE is_active = TRUE ORDER BY release_date DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/movies/:id
const getMovieById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Movie not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/movies/:id/showtimes
const getMovieShowtimes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, sc.name AS screen_name
       FROM showtimes s
       JOIN screens sc ON s.screen_id = sc.id
       WHERE s.movie_id = ?
         AND (s.show_date > CURDATE() OR (s.show_date = CURDATE() AND s.show_time > CURTIME()))
       ORDER BY s.show_date, s.show_time`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/movies  (admin)
const createMovie = async (req, res) => {
  const { title, description, genre, duration, language, release_date, poster_url, backdrop_url, rating,
          is_active, is_featured, is_premiere, is_now_showing, is_coming_soon } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (duration !== undefined && duration !== '' && (isNaN(Number(duration)) || Number(duration) <= 0))
    return res.status(400).json({ message: 'duration must be a positive number' });
  if (rating !== undefined && rating !== '' && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10))
    return res.status(400).json({ message: 'rating must be between 0 and 10' });
  if (release_date !== undefined && release_date !== '' && isNaN(Date.parse(release_date)))
    return res.status(400).json({ message: 'release_date must be a valid date' });

  try {
    const [result] = await pool.query(
      `INSERT INTO movies (title, description, genre, duration, language, release_date, poster_url, backdrop_url,
        rating, is_active, is_featured, is_premiere, is_now_showing, is_coming_soon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, genre, duration, language, release_date, poster_url, backdrop_url || null,
       rating || 0, is_active !== false ? 1 : 0, is_featured ? 1 : 0, is_premiere ? 1 : 0, is_now_showing ? 1 : 0, is_coming_soon ? 1 : 0]
    );
    res.status(201).json({ message: 'Movie created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/movies/:id  (admin)
const updateMovie = async (req, res) => {
  const { title, description, genre, duration, language, release_date, poster_url, backdrop_url,
          rating, is_active, is_featured, is_premiere, is_now_showing, is_coming_soon } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (duration !== undefined && duration !== '' && (isNaN(Number(duration)) || Number(duration) <= 0))
    return res.status(400).json({ message: 'duration must be a positive number' });
  if (rating !== undefined && rating !== '' && (isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 10))
    return res.status(400).json({ message: 'rating must be between 0 and 10' });
  if (release_date !== undefined && release_date !== '' && isNaN(Date.parse(release_date)))
    return res.status(400).json({ message: 'release_date must be a valid date' });
  try {
    await pool.query(
      `UPDATE movies SET title=?, description=?, genre=?, duration=?, language=?, release_date=?,
        poster_url=?, backdrop_url=?, rating=?, is_active=?,
        is_featured=?, is_premiere=?, is_now_showing=?, is_coming_soon=?
       WHERE id=?`,
      [title, description, genre, duration, language, release_date, poster_url, backdrop_url || null,
       rating, is_active, is_featured ? 1 : 0, is_premiere ? 1 : 0, is_now_showing ? 1 : 0, is_coming_soon ? 1 : 0,
       req.params.id]
    );
    res.json({ message: 'Movie updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/movies/:id  (admin)
const deleteMovie = async (req, res) => {
  try {
    await pool.query('DELETE FROM movies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllMovies, getMovieById, getMovieShowtimes, createMovie, updateMovie, deleteMovie };
