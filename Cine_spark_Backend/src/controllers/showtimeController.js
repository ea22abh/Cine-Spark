const { pool } = require('../config/db');

// GET /api/showtimes
const getAllShowtimes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, m.title AS movie_title, m.poster_url, sc.name AS screen_name
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN screens sc ON s.screen_id = sc.id
       ORDER BY s.show_date DESC, s.show_time DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/showtimes/:id
const getShowtimeById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, m.title AS movie_title, m.duration, sc.name AS screen_name, sc.total_seats
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN screens sc ON s.screen_id = sc.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Showtime not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/showtimes  (admin)
const createShowtime = async (req, res) => {
  const { movie_id, screen_id, show_date, show_time, price, available_seats } = req.body;
  if (!movie_id || !screen_id || !show_date || !show_time || price == null || !available_seats)
    return res.status(400).json({ message: 'All fields are required' });
  if (isNaN(Date.parse(show_date)))
    return res.status(400).json({ message: 'show_date must be a valid date (YYYY-MM-DD)' });
  if (Number(price) <= 0)
    return res.status(400).json({ message: 'price must be greater than 0' });
  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!TIME_RE.test(show_time))
    return res.status(400).json({ message: 'show_time must be a valid time (HH:MM or HH:MM:SS)' });
  if (!Number.isInteger(Number(available_seats)) || Number(available_seats) < 0)
    return res.status(400).json({ message: 'available_seats must be a non-negative integer' });

  try {
    const [movieRows] = await pool.query('SELECT id FROM movies WHERE id = ?', [movie_id]);
    if (movieRows.length === 0)
      return res.status(404).json({ message: 'movie_id does not reference an existing movie' });

    const [screenRows] = await pool.query('SELECT id FROM screens WHERE id = ?', [screen_id]);
    if (screenRows.length === 0)
      return res.status(404).json({ message: 'screen_id does not reference an existing screen' });

    const [result] = await pool.query(
      'INSERT INTO showtimes (movie_id, screen_id, show_date, show_time, price, available_seats) VALUES (?, ?, ?, ?, ?, ?)',
      [movie_id, screen_id, show_date, show_time, price, available_seats]
    );
    res.status(201).json({ message: 'Showtime created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/showtimes/:id  (admin)
const updateShowtime = async (req, res) => {
  const { movie_id, screen_id, show_date, show_time, price, available_seats } = req.body;
  if (!movie_id || !screen_id || !show_date || !show_time || price == null || !available_seats)
    return res.status(400).json({ message: 'All fields are required' });
  if (isNaN(Date.parse(show_date)))
    return res.status(400).json({ message: 'show_date must be a valid date (YYYY-MM-DD)' });
  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!TIME_RE.test(show_time))
    return res.status(400).json({ message: 'show_time must be a valid time (HH:MM or HH:MM:SS)' });
  if (Number(price) <= 0)
    return res.status(400).json({ message: 'price must be greater than 0' });
  if (!Number.isInteger(Number(available_seats)) || Number(available_seats) < 0)
    return res.status(400).json({ message: 'available_seats must be a non-negative integer' });
  try {
    await pool.query(
      'UPDATE showtimes SET movie_id=?, screen_id=?, show_date=?, show_time=?, price=?, available_seats=? WHERE id=?',
      [movie_id, screen_id, show_date, show_time, price, available_seats, req.params.id]
    );
    res.json({ message: 'Showtime updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/showtimes/:id  (admin)
const deleteShowtime = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      'SELECT id FROM bookings WHERE showtime_id = ? AND status = "confirmed" LIMIT 1',
      [req.params.id]
    );
    if (bookings.length > 0) {
      return res.status(400).json({ message: 'Cannot delete: this showtime has confirmed bookings. Cancel them first via Manage Bookings.' });
    }
    await pool.query('DELETE FROM showtimes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Showtime deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllShowtimes, getShowtimeById, createShowtime, updateShowtime, deleteShowtime };
