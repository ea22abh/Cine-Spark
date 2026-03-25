const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/admin/movies — returns ALL movies including inactive
const getAllMoviesAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users WHERE role = "user"');
    const [[{ totalMovies }]] = await pool.query('SELECT COUNT(*) AS totalMovies FROM movies WHERE is_active = TRUE');
    const [[{ totalBookings }]] = await pool.query('SELECT COUNT(*) AS totalBookings FROM bookings WHERE status = "confirmed"');
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_price),0) AS totalRevenue FROM bookings WHERE status = "confirmed"');

    const [recentBookings] = await pool.query(
      `SELECT b.id, b.booking_ref, b.total_price, b.created_at, b.status,
              u.name AS user_name, m.title AS movie_title
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN showtimes st ON b.showtime_id = st.id
       JOIN movies m ON st.movie_id = m.id
       ORDER BY b.created_at DESC LIMIT 10`
    );

    // Revenue & bookings per movie
    const [revenueByMovie] = await pool.query(
      `SELECT m.title, COUNT(b.id) AS bookings, COALESCE(SUM(b.total_price),0) AS revenue
       FROM movies m
       LEFT JOIN showtimes st ON st.movie_id = m.id
       LEFT JOIN bookings b ON b.showtime_id = st.id AND b.status = 'confirmed'
       GROUP BY m.id, m.title
       ORDER BY revenue DESC`
    );

    res.json({ totalUsers, totalMovies, totalBookings, totalRevenue, recentBookings, revenueByMovie });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Users ───────────────────────────────────────────────────────────────────

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/users/:id/role  — promote/demote user
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role))
    return res.status(400).json({ message: 'role must be "user" or "admin"' });
  if (String(req.params.id) === String(req.user.id))
    return res.status(400).json({ message: 'You cannot change your own role' });

  try {
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

// GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS user_name, u.email AS user_email,
              m.title AS movie_title, st.show_date, st.show_time, sc.name AS screen_name,
              GROUP_CONCAT(CONCAT(s.row_label, s.seat_number) ORDER BY s.row_label, s.seat_number) AS seats
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN showtimes st ON b.showtime_id = st.id
       JOIN movies m ON st.movie_id = m.id
       JOIN screens sc ON st.screen_id = sc.id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats s ON bs.seat_id = s.id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/bookings/:id/status  — admin cancel booking
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'cancelled'].includes(status))
    return res.status(400).json({ message: 'status must be "confirmed" or "cancelled"' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[booking]] = await conn.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!booking) {
      await conn.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status === status) {
      await conn.rollback();
      return res.status(400).json({ message: `Booking is already ${status}` });
    }

    await conn.query('UPDATE bookings SET status = ? WHERE id = ?', [status, booking.id]);

    // If cancelling, free up the seats
    if (status === 'cancelled' && booking.status === 'confirmed') {
      const [[{ cnt }]] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM booking_seats WHERE booking_id = ?',
        [booking.id]
      );
      await conn.query(
        'UPDATE showtimes SET available_seats = available_seats + ? WHERE id = ?',
        [cnt, booking.showtime_id]
      );
    }

    await conn.commit();
    res.json({ message: `Booking status updated to ${status}` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

// ─── Screens ──────────────────────────────────────────────────────────────────

// GET /api/admin/screens
const getAllScreens = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM screens ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/screens
const createScreen = async (req, res) => {
  const { name, total_seats } = req.body;
  if (!name || !total_seats)
    return res.status(400).json({ message: 'name and total_seats are required' });
  if (Number(total_seats) <= 0)
    return res.status(400).json({ message: 'total_seats must be greater than 0' });

  try {
    const [result] = await pool.query(
      'INSERT INTO screens (name, total_seats) VALUES (?, ?)',
      [name, total_seats]
    );
    res.status(201).json({ message: 'Screen created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/screens/:id
const updateScreen = async (req, res) => {
  const { name, total_seats } = req.body;
  if (!name || !total_seats)
    return res.status(400).json({ message: 'name and total_seats are required' });
  if (Number(total_seats) <= 0)
    return res.status(400).json({ message: 'total_seats must be greater than 0' });
  try {
    const [result] = await pool.query(
      'UPDATE screens SET name = ?, total_seats = ? WHERE id = ?',
      [name, total_seats, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Screen not found' });
    res.json({ message: 'Screen updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/screens/:id
const deleteScreen = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM screens WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Screen not found' });
    res.json({ message: 'Screen deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Seat Allocation ──────────────────────────────────────────────────────────

/**
 * POST /api/admin/screens/:id/generate-seats
 * Body: { rows: ["A","B","C"], seats_per_row: 10, seat_type: "standard" }
 * Auto-generates the full seat layout for a screen.
 */
const generateSeats = async (req, res) => {
  const { rows, seats_per_row, seat_type } = req.body;
  const screen_id = req.params.id;

  if (!rows || !Array.isArray(rows) || rows.length === 0 || !seats_per_row)
    return res.status(400).json({ message: 'rows (array) and seats_per_row are required' });
  if (rows.length > 26)
    return res.status(400).json({ message: 'rows cannot exceed 26 entries' });
  if (Number(seats_per_row) > 100 || Number(seats_per_row) < 1)
    return res.status(400).json({ message: 'seats_per_row must be between 1 and 100' });

  try {
    const seatData = [];
    for (const row of rows) {
      for (let n = 1; n <= seats_per_row; n++) {
        seatData.push([screen_id, row.toUpperCase(), n, seat_type || 'standard']);
      }
    }

    // INSERT IGNORE skips duplicates so safe to re-run
    await pool.query(
      'INSERT IGNORE INTO seats (screen_id, row_label, seat_number, seat_type) VALUES ?',
      [seatData]
    );

    // Sync total_seats to actual seat count in DB
    const [[{ actual }]] = await pool.query(
      'SELECT COUNT(*) AS actual FROM seats WHERE screen_id = ?',
      [screen_id]
    );
    await pool.query('UPDATE screens SET total_seats = ? WHERE id = ?', [actual, screen_id]);

    res.status(201).json({
      message: `Generated ${seatData.length} seats (${actual} total) for screen ${screen_id}`,
      total: actual,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Admin Profile ────────────────────────────────────────────────────────────

// PUT /api/admin/profile  — update admin name / email
const updateAdminProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
  if (!EMAIL_RE.test(email.trim()))
    return res.status(400).json({ message: 'Invalid email format' });

  try {
    const [taken] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (taken.length > 0) return res.status(400).json({ message: 'Email is already in use by another account' });

    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name.trim(), email.trim(), req.user.id]);
    res.json({ message: 'Profile updated', user: { id: req.user.id, name: name.trim(), email: email.trim(), role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/password  — change admin password
const updateAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Current and new password are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters' });

  try {
    const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMoviesAdmin,
  getDashboard,
  getAllUsers, updateUserRole,
  getAllBookings, updateBookingStatus,
  getAllScreens, createScreen, updateScreen, deleteScreen,
  generateSeats,
  updateAdminProfile, updateAdminPassword,
};
