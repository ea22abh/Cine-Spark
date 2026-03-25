const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign({ id: 1, email: 'admin@b.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken  = jwt.sign({ id: 2, email: 'user@b.com',  role: 'user'  }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());

// ── Get Seats By Showtime ─────────────────────────────────────────────────────

describe('GET /api/seats/showtime/:showtimeId', () => {
  it('200 returns seat list', async () => {
    pool.query.mockResolvedValueOnce([[
      { id: 1, row_label: 'A', seat_number: 1, seat_type: 'standard', status: 'available' },
      { id: 2, row_label: 'A', seat_number: 2, seat_type: 'standard', status: 'booked' },
    ]]);
    const res = await request(app).get('/api/seats/showtime/1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].status).toBe('available');
    expect(res.body[1].status).toBe('booked');
  });

  it('200 returns empty array when no seats configured', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/seats/showtime/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── Create Seat ───────────────────────────────────────────────────────────────

describe('POST /api/seats (admin only)', () => {
  it('401 when no token', async () => {
    const res = await request(app).post('/api/seats').send({ screen_id: 1, row_label: 'A', seat_number: 1 });
    expect(res.status).toBe(401);
  });

  it('403 when non-admin token', async () => {
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${userToken}`)
      .send({ screen_id: 1, row_label: 'A', seat_number: 1 });
    expect(res.status).toBe(403);
  });

  it('400 when screen_id is missing', async () => {
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ row_label: 'A', seat_number: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/screen_id/i);
  });

  it('400 when row_label is missing', async () => {
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, seat_number: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/row_label/i);
  });

  it('400 when seat_number is missing', async () => {
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, row_label: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/seat_number/i);
  });

  it('201 on successful seat creation with default seat_type', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 10 }]);
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, row_label: 'A', seat_number: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
    expect(res.body.message).toBe('Seat added');
  });

  it('201 on successful seat creation with explicit seat_type', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 11 }]);
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, row_label: 'B', seat_number: 5, seat_type: 'vip' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(11);
  });

  it('409 when seat already exists (ER_DUP_ENTRY)', async () => {
    const dupErr = new Error("Duplicate entry '1-A-1' for key 'seats.screen_id'");
    dupErr.code = 'ER_DUP_ENTRY';
    pool.query.mockRejectedValueOnce(dupErr);
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, row_label: 'A', seat_number: 1 });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('500 does NOT expose raw DB error message', async () => {
    pool.query.mockRejectedValueOnce(new Error('Lost connection to MySQL server'));
    const res = await request(app).post('/api/seats').set('Authorization', `Bearer ${adminToken}`)
      .send({ screen_id: 1, row_label: 'C', seat_number: 1 });
    expect(res.status).toBe(500);
    expect(res.body.error).toBeUndefined();
    expect(res.body.message).toBe('Server error');
  });
});
