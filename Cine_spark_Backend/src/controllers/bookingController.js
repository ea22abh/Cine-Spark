const { pool } = require('../config/db');
const crypto = require('crypto');

const generateRef = () => 'CS' + crypto.randomBytes(4).toString('hex').toUpperCase();

// POST /api/bookings  — create a booking
const createBooking = async (req, res) => {
  const { showtime_id, seat_ids } = req.body;
  const user_id = req.user.id;

  if (!showtime_id || !Array.isArray(seat_ids) || seat_ids.length === 0)
    return res.status(400).json({ message: 'showtime_id and seat_ids (non-empty array) are required' });
  if (!seat_ids.every((id) => Number.isInteger(Number(id)) && Number(id) > 0))
    return res.status(400).json({ message: 'seat_ids must contain valid seat IDs' });

  if (seat_ids.length > 10)
    return res.status(400).json({ message: 'Maximum 10 seats per booking' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify showtime exists and has enough seats
    const [[showtime]] = await conn.query(
      'SELECT * FROM showtimes WHERE id = ? FOR UPDATE',
      [showtime_id]
    );
    if (!showtime) {
      await conn.rollback();
      return res.status(404).json({ message: 'Showtime not found' });
    }
    const dateStr = showtime.show_date instanceof Date
      ? showtime.show_date.toISOString().slice(0, 10)
      : String(showtime.show_date).slice(0, 10);
    const showtimeDateTime = new Date(`${dateStr}T${showtime.show_time}`);
    if (showtimeDateTime <= new Date()) {
      await conn.rollback();
      return res.status(400).json({ message: 'This showtime has already passed' });
    }
    if (showtime.available_seats < seat_ids.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    // Check none of the seats are already booked
    const [alreadyBooked] = await conn.query(
      'SELECT seat_id FROM booking_seats WHERE showtime_id = ? AND seat_id IN (?)',
      [showtime_id, seat_ids]
    );
    if (alreadyBooked.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'One or more seats already booked' });
    }

    const PRICE_MULTIPLIERS = { vip: 1.4, premium: 1.2, standard: 1.0 };
    const [seatTypeRows] = await conn.query('SELECT id, seat_type FROM seats WHERE id IN (?)', [seat_ids]);
    const total_price = seatTypeRows.reduce((sum, s) => {
      return sum + Math.round(showtime.price * (PRICE_MULTIPLIERS[s.seat_type] || 1.0));
    }, 0);
    const booking_ref = generateRef();

    const [bookingResult] = await conn.query(
      'INSERT INTO bookings (user_id, showtime_id, total_price, booking_ref) VALUES (?, ?, ?, ?)',
      [user_id, showtime_id, total_price, booking_ref]
    );
    const booking_id = bookingResult.insertId;

    const seatRows = seat_ids.map((s) => [booking_id, s, showtime_id]);
    await conn.query('INSERT INTO booking_seats (booking_id, seat_id, showtime_id) VALUES ?', [seatRows]);

    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE id = ?',
      [seat_ids.length, showtime_id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Booking confirmed', booking_ref, booking_id, total_price });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'One or more seats were just taken. Please reselect.' });
    }
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/bookings/my  — user's own bookings
const getMyBookings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, m.title AS movie_title, m.poster_url,
              st.show_date, st.show_time, sc.name AS screen_name,
              GROUP_CONCAT(CONCAT(s.row_label, s.seat_number) ORDER BY s.row_label, s.seat_number) AS seats
       FROM bookings b
       JOIN showtimes st ON b.showtime_id = st.id
       JOIN movies m ON st.movie_id = m.id
       JOIN screens sc ON st.screen_id = sc.id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats s ON bs.seat_id = s.id
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, m.title AS movie_title, m.poster_url,
              st.show_date, st.show_time, st.price, sc.name AS screen_name,
              GROUP_CONCAT(CONCAT(s.row_label, s.seat_number) ORDER BY s.row_label, s.seat_number) AS seats
       FROM bookings b
       JOIN showtimes st ON b.showtime_id = st.id
       JOIN movies m ON st.movie_id = m.id
       JOIN screens sc ON st.screen_id = sc.id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats s ON bs.seat_id = s.id
       WHERE b.id = ? AND b.user_id = ?
       GROUP BY b.id`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[booking]] = await conn.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE',
      [req.params.id, req.user.id]
    );
    if (!booking) {
      await conn.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    const [seatRows] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM booking_seats WHERE booking_id = ?',
      [booking.id]
    );
    const seatCount = seatRows[0].cnt;

    await conn.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', booking.id]);
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats + ? WHERE id = ?',
      [seatCount, booking.showtime_id]
    );

    await conn.commit();
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
