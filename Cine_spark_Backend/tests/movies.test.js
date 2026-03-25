const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign({ id: 1, email: 'admin@b.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken  = jwt.sign({ id: 2, email: 'user@b.com',  role: 'user'  }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());

// ── Create Movie ──────────────────────────────────────────────────────────────

describe('POST /api/movies (admin only)', () => {
  it('401 when no token provided', async () => {
    const res = await request(app).post('/api/movies').send({ title: 'Test Movie' });
    expect(res.status).toBe(401);
  });

  it('403 when non-admin token provided', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${userToken}`).send({ title: 'Test Movie' });
    expect(res.status).toBe(403);
  });

  it('400 when title is missing', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it('400 when duration is 0 (boundary: must be > 0)', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', duration: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/duration/i);
  });

  it('400 when duration is negative', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', duration: -5 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/duration/i);
  });

  it('400 when duration is not a number', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', duration: 'two hours' });
    expect(res.status).toBe(400);
  });

  it('400 when rating is 10.1 (above max)', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', rating: 10.1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('400 when rating is negative', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', rating: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('201 when rating is exactly 10 (boundary: max passes)', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 42 }]);
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', rating: 10 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(42);
  });

  it('201 when rating is exactly 0 (boundary: min passes)', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 43 }]);
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', rating: 0 });
    expect(res.status).toBe(201);
  });

  it('400 when release_date is not a valid date string', async () => {
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', release_date: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });

  it('201 when release_date is a valid ISO date string', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 44 }]);
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie', release_date: '2026-12-25' });
    expect(res.status).toBe(201);
  });

  it('500 does NOT expose raw DB error message', async () => {
    pool.query.mockRejectedValueOnce(new Error('Deadlock found'));
    const res = await request(app).post('/api/movies').set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Movie' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBeUndefined();
  });
});

// ── Get Movie Showtimes ───────────────────────────────────────────────────────

describe('GET /api/movies/:id/showtimes', () => {
  it('200 returns showtimes array', async () => {
    pool.query.mockResolvedValueOnce([[
      { id: 11, show_date: '2030-01-01', show_time: '18:00:00', screen_name: 'Screen 1' },
    ]]);
    const res = await request(app).get('/api/movies/1/showtimes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('SQL query includes CURTIME() for time-aware filtering', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await request(app).get('/api/movies/1/showtimes');
    const calledSql = pool.query.mock.calls[0][0];
    expect(calledSql).toMatch(/CURTIME\(\)/);
    expect(calledSql).toMatch(/CURDATE\(\)/);
  });
});

// ── Get Movie By Id ───────────────────────────────────────────────────────────

describe('GET /api/movies/:id', () => {
  it('200 returns movie data', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Test', is_active: 1 }]]);
    const res = await request(app).get('/api/movies/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test');
  });

  it('404 when movie not found', async () => {
    pool.query.mockResolvedValueOnce([[]]); // empty result
    const res = await request(app).get('/api/movies/99999');
    expect(res.status).toBe(404);
  });
});
