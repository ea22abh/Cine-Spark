const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

beforeEach(() => jest.clearAllMocks());

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('400 when email format is invalid (no @)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('400 when email format is invalid (no domain)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'test@', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('400 when password is 7 chars (boundary: min 8 fails)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'a@b.com', password: '1234567' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8 characters/i);
  });

  it('201 when password is exactly 8 chars (boundary: min 8 passes)', async () => {
    pool.query
      .mockResolvedValueOnce([[]])                   // SELECT: email not taken
      .mockResolvedValueOnce([{ insertId: 1 }]);     // INSERT user
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'a@b.com', password: '12345678' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@b.com');
  });

  it('409 when email is already registered', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // SELECT: email already exists
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });

  it('500 does NOT expose raw DB error message', async () => {
    pool.query.mockRejectedValueOnce(new Error('Table cinespark.users does not exist'));
    const res = await request(app).post('/api/auth/register').send({ name: 'T', email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBeUndefined();
    expect(res.body.message).toBe('Server error');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('400 when email format is invalid', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('401 when user does not exist', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no user found
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@b.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('401 when password is wrong', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    pool.query.mockResolvedValueOnce([[{ id: 1, email: 'a@b.com', password: hashed, role: 'user', name: 'Test' }]]);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('200 and returns token on valid credentials', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    pool.query.mockResolvedValueOnce([[{ id: 1, email: 'a@b.com', password: hashed, role: 'user', name: 'Test' }]]);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@b.com');
    expect(res.body.user.password).toBeUndefined(); // password not leaked
  });

  it('500 does NOT expose raw DB error message', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection lost'));
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBeUndefined();
  });
});

// ── Get Me ────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  const validToken = jwt.sign({ id: 1, email: 'a@b.com', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: 1, email: 'a@b.com', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '-1s' });

  it('401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 with invalid/malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer notavalidtoken');
    expect(res.status).toBe(401);
  });

  it('401 with expired token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('200 returns user data with valid token', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, name: 'Test', email: 'a@b.com', role: 'user', created_at: '2026-01-01' }]]);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
    expect(res.body.password).toBeUndefined();
  });

  it('404 when user no longer exists in DB', async () => {
    pool.query.mockResolvedValueOnce([[]]); // user deleted from DB
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(404);
  });
});
