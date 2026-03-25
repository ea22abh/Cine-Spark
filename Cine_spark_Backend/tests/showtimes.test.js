const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign({ id: 1, email: 'admin@b.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken  = jwt.sign({ id: 2, email: 'user@b.com',  role: 'user'  }, process.env.JWT_SECRET, { expiresIn: '1h' });

const validBody = {
  movie_id: 1, screen_id: 1,
  show_date: '2030-12-01', show_time: '18:00:00',
  price: 12.50, available_seats: 100,
};

beforeEach(() => jest.clearAllMocks());

// ── Create Showtime ───────────────────────────────────────────────────────────

describe('POST /api/showtimes (admin only)', () => {
  it('401 when no token', async () => {
    const res = await request(app).post('/api/showtimes').send(validBody);
    expect(res.status).toBe(401);
  });

  it('403 when non-admin token', async () => {
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${userToken}`).send(validBody);
    expect(res.status).toBe(403);
  });

  it('400 when required fields are missing', async () => {
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('400 when show_date is invalid format', async () => {
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, show_date: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });

  it('400 when price is 0 (boundary: must be > 0)', async () => {
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, price: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/price/i);
  });

  it('400 when price is negative', async () => {
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/price/i);
  });

  it('404 when movie_id does not exist', async () => {
    pool.query
      .mockResolvedValueOnce([[]])   // movie lookup returns empty
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`).send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/movie/i);
  });

  it('404 when screen_id does not exist', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }]])  // movie found
      .mockResolvedValueOnce([[]])            // screen not found
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`).send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/screen/i);
  });

  it('201 when all inputs are valid and references exist', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }]])    // movie found
      .mockResolvedValueOnce([[{ id: 1 }]])    // screen found
      .mockResolvedValueOnce([{ insertId: 5 }]); // INSERT
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`).send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(5);
  });

  it('500 does NOT expose raw DB error message', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }]])   // movie found
      .mockResolvedValueOnce([[{ id: 1 }]])   // screen found
      .mockRejectedValueOnce(new Error('Connection timeout'));
    const res = await request(app).post('/api/showtimes').set('Authorization', `Bearer ${adminToken}`).send(validBody);
    expect(res.status).toBe(500);
    expect(res.body.error).toBeUndefined();
  });
});

// ── Get Showtime By Id ────────────────────────────────────────────────────────

describe('GET /api/showtimes/:id', () => {
  it('200 returns showtime data', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1, show_date: '2030-01-01', show_time: '18:00:00',
      movie_title: 'Test', screen_name: 'Screen 1', total_seats: 100
    }]]);
    const res = await request(app).get('/api/showtimes/1');
    expect(res.status).toBe(200);
    expect(res.body.movie_title).toBe('Test');
  });

  it('404 when showtime not found', async () => {
    pool.query.mockResolvedValueOnce([[]]); // empty result
    const res = await request(app).get('/api/showtimes/99999');
    expect(res.status).toBe(404);
  });
});

// ── Delete Showtime ───────────────────────────────────────────────────────────

describe('DELETE /api/showtimes/:id (admin only)', () => {
  it('400 when confirmed bookings exist', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 5 }]]); // confirmed booking exists
    const res = await request(app).delete('/api/showtimes/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/confirmed bookings/i);
  });

  it('200 when no confirmed bookings exist', async () => {
    pool.query
      .mockResolvedValueOnce([[]])             // no confirmed bookings
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE
    const res = await request(app).delete('/api/showtimes/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
