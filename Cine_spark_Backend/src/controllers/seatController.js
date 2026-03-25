const { pool } = require('../config/db');

// GET /api/seats/showtime/:showtimeId  — get all seats with availability for a showtime
const getSeatsByShowtime = async (req, res) => {
  const { showtimeId } = req.params;
  try {
    const [seats] = await pool.query(
      `SELECT s.id, s.row_label, s.seat_number, s.seat_type,
              CASE WHEN b.id IS NOT NULL THEN 'booked' ELSE 'available' END AS status
       FROM seats s
       JOIN showtimes st ON st.screen_id = s.screen_id
       LEFT JOIN booking_seats bs ON bs.seat_id = s.id AND bs.showtime_id = ?
       LEFT JOIN bookings b ON b.id = bs.booking_id AND b.status = 'confirmed'
       WHERE st.id = ?
       ORDER BY s.row_label, s.seat_number`,
      [showtimeId, showtimeId]
    );
    res.json(seats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/seats  (admin) — add seat to a screen
const createSeat = async (req, res) => {
  const { screen_id, row_label, seat_number, seat_type } = req.body;
  if (!screen_id || !row_label || !seat_number)
    return res.status(400).json({ message: 'screen_id, row_label and seat_number are required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO seats (screen_id, row_label, seat_number, seat_type) VALUES (?, ?, ?, ?)',
      [screen_id, row_label, seat_number, seat_type || 'standard']
    );
    res.status(201).json({ message: 'Seat added', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Seat already exists for this screen, row, and number' });
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSeatsByShowtime, createSeat };
