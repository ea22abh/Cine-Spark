const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');

const userToken  = jwt.sign({ id: 1, email: 'user@b.com',  role: 'user'  }, process.env.JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ id: 2, email: 'admin@b.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Reusable mock connection for transaction-based tests
const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn(),
};

const futureShowtime = {
  id: 1, show_date: '2030-01-01', show_time: '18:00:00',
  price: 10, available_seats: 50,
};

beforeEach(() => {
  jest.resetAllMocks();
  mockConn.beginTransaction.mockResolvedValue();
  mockConn.commit.mockResolvedValue();
  mockConn.rollback.mockResolvedValue();
  pool.getConnection.mockResolvedValue(mockConn);
});

// ── Create Booking ────────────────────────────────────────────────────────────

describe('POST /api/bookings', () => {
  it('401 when no token', async () => {
    const res = await request(app).post('/api/bookings').send({ showtime_id: 1, seat_ids: [1] });
    expect(res.status).toBe(401);
  });

  it('400 when seat_ids is not an array (number)', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: 42 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/seat_ids/i);
  });

  it('400 when seat_ids is not an array (string)', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('400 when seat_ids is an empty array', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [] });
    expect(res.status).toBe(400);
  });

  it('400 when showtime_id is missing', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ seat_ids: [1, 2] });
    expect(res.status).toBe(400);
  });

  it('400 when more than 10 seats requested (boundary: 11 fails)', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1,2,3,4,5,6,7,8,9,10,11] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maximum 10/i);
  });

  it('201 when exactly 10 seats requested (boundary: 10 passes)', async () => {
    mockConn.query
      .mockResolvedValueOnce([[futureShowtime]])                              // showtime query
      .mockResolvedValueOnce([[]])                                            // no already booked
      .mockResolvedValueOnce([[...Array(10).keys()].map(i => ({ id: i+1, seat_type: 'standard' }))])  // seat types
      .mockResolvedValueOnce([{ insertId: 100 }])                            // INSERT booking
      .mockResolvedValueOnce([{}])                                           // INSERT booking_seats
      .mockResolvedValueOnce([{}]);                                          // UPDATE available_seats
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1,2,3,4,5,6,7,8,9,10] });
    expect(res.status).toBe(201);
  });

  it('404 when showtime does not exist', async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // showtime not found (empty array)
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 99999, seat_ids: [1] });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/showtime not found/i);
  });

  it('400 when showtime has already passed (past date)', async () => {
    mockConn.query.mockResolvedValueOnce([[{
      id: 1, show_date: '2020-01-01', show_time: '10:00:00', price: 10, available_seats: 50,
    }]]);
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/passed/i);
  });

  it('400 when not enough available seats (requesting 5, only 3 left)', async () => {
    mockConn.query.mockResolvedValueOnce([[{ ...futureShowtime, available_seats: 3 }]]);
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1, 2, 3, 4, 5] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not enough/i);
  });

  it('409 when one or more seats are already booked', async () => {
    mockConn.query
      .mockResolvedValueOnce([[futureShowtime]])
      .mockResolvedValueOnce([[{ seat_id: 1 }]]); // seat 1 already booked
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1, 2] });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  it('409 on DB duplicate key error (race condition)', async () => {
    const dupErr = new Error('Duplicate entry');
    dupErr.code = 'ER_DUP_ENTRY';
    mockConn.query
      .mockResolvedValueOnce([[futureShowtime]])
      .mockResolvedValueOnce([[]])                           // no pre-check conflicts
      .mockResolvedValueOnce([[{ id: 1, seat_type: 'standard' }]])
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockRejectedValueOnce(dupErr);                        // INSERT booking_seats fails with dup
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`)
      .send({ showtime_id: 1, seat_ids: [1] });
    expect(res.status).toBe(409);
  });
});

// ── Get My Bookings ───────────────────────────────────────────────────────────

describe('GET /api/bookings/my', () => {
  it('401 when no token', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.status).toBe(401);
  });

  it('200 returns user bookings array', async () => {
    pool.query.mockResolvedValueOnce([[
      { id: 1, booking_ref: 'CS123', status: 'confirmed', movie_title: 'Test', seats: 'A1,A2' }
    ]]);
    const res = await request(app).get('/api/bookings/my').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].booking_ref).toBe('CS123');
  });
});

// ── Cancel Booking ────────────────────────────────────────────────────────────

describe('PATCH /api/bookings/:id/cancel', () => {
  it('401 when no token', async () => {
    const res = await request(app).patch('/api/bookings/1/cancel');
    expect(res.status).toBe(401);
  });

  it('404 when booking not found', async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // booking not found (empty)
    const res = await request(app).patch('/api/bookings/999/cancel').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('400 when booking is already cancelled', async () => {
    mockConn.query.mockResolvedValueOnce([[{ id: 1, status: 'cancelled', showtime_id: 1, user_id: 1 }]]);
    const res = await request(app).patch('/api/bookings/1/cancel').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already cancelled/i);
  });

  it('200 on successful cancellation', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 1, status: 'confirmed', showtime_id: 1, user_id: 1 }]])
      .mockResolvedValueOnce([[{ cnt: 2 }]])        // seat count
      .mockResolvedValueOnce([{}])                   // UPDATE booking status
      .mockResolvedValueOnce([{}]);                  // UPDATE available_seats
    const res = await request(app).patch('/api/bookings/1/cancel').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });
});
