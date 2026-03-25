const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const adminToken = jwt.sign({ id: 1, email: 'admin@b.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken  = jwt.sign({ id: 2, email: 'user@b.com',  role: 'user'  }, process.env.JWT_SECRET, { expiresIn: '1h' });

const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  pool.getConnection.mockResolvedValue(mockConn);
});

// ── Change Admin Password ─────────────────────────────────────────────────────

describe('PUT /api/admin/password', () => {
  it('403 when non-admin tries to access', async () => {
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${userToken}`)
      .send({ currentPassword: 'any', newPassword: 'newpassword123' });
    expect(res.status).toBe(403);
  });

  it('401 when no token', async () => {
    const res = await request(app).put('/api/admin/password')
      .send({ currentPassword: 'any', newPassword: 'newpassword123' });
    expect(res.status).toBe(401);
  });

  it('400 when currentPassword is missing', async () => {
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'newpassword123' });
    expect(res.status).toBe(400);
  });

  it('400 when newPassword is missing', async () => {
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'oldpass' });
    expect(res.status).toBe(400);
  });

  it('400 when newPassword is 7 chars (boundary: min 8 fails)', async () => {
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'oldpass1', newPassword: '1234567' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8 characters/i);
  });

  it('200 when newPassword is exactly 8 chars (boundary: min 8 passes)', async () => {
    const hashed = await bcrypt.hash('oldpass1', 10);
    pool.query
      .mockResolvedValueOnce([[{ id: 1, password: hashed }]])
      .mockResolvedValueOnce([{}]);
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'oldpass1', newPassword: '12345678' });
    expect(res.status).toBe(200);
  });

  it('400 when current password is incorrect', async () => {
    const hashed = await bcrypt.hash('correctpass', 10);
    pool.query.mockResolvedValueOnce([[{ id: 1, password: hashed }]]);
    const res = await request(app).put('/api/admin/password').set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpassword123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incorrect/i);
  });
});

// ── Create Screen ─────────────────────────────────────────────────────────────

describe('POST /api/admin/screens', () => {
  it('401 when no token', async () => {
    const res = await request(app).post('/api/admin/screens').send({ name: 'Screen 1', total_seats: 50 });
    expect(res.status).toBe(401);
  });

  it('403 when non-admin', async () => {
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Screen 1', total_seats: 50 });
    expect(res.status).toBe(403);
  });

  it('400 when name is missing', async () => {
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${adminToken}`)
      .send({ total_seats: 50 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('400 when total_seats is missing', async () => {
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen 1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('400 when total_seats is 0 (boundary: must be > 0)', async () => {
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen 1', total_seats: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/total_seats/i);
  });

  it('400 when total_seats is negative', async () => {
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen 1', total_seats: -10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/total_seats/i);
  });

  it('201 when total_seats is 1 (boundary: minimum valid)', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 3 }]);
    const res = await request(app).post('/api/admin/screens').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen 1', total_seats: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(3);
  });
});

// ── Update Screen ─────────────────────────────────────────────────────────────

describe('PUT /api/admin/screens/:id', () => {
  it('400 when total_seats is 0', async () => {
    const res = await request(app).put('/api/admin/screens/1').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen 1', total_seats: 0 });
    expect(res.status).toBe(400);
  });

  it('400 when name is missing', async () => {
    const res = await request(app).put('/api/admin/screens/1').set('Authorization', `Bearer ${adminToken}`)
      .send({ total_seats: 50 });
    expect(res.status).toBe(400);
  });

  it('200 on valid update', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/admin/screens/1').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen Updated', total_seats: 80 });
    expect(res.status).toBe(200);
  });

  it('404 when screen not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/admin/screens/999').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Screen Updated', total_seats: 80 });
    expect(res.status).toBe(404);
  });
});

// ── Update User Role ──────────────────────────────────────────────────────────

describe('PATCH /api/admin/users/:id/role', () => {
  it('400 when role is invalid value', async () => {
    const res = await request(app).patch('/api/admin/users/2/role').set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superuser' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/role/i);
  });

  it('400 when role is empty string', async () => {
    const res = await request(app).patch('/api/admin/users/2/role').set('Authorization', `Bearer ${adminToken}`)
      .send({ role: '' });
    expect(res.status).toBe(400);
  });

  it('200 when role is "admin"', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).patch('/api/admin/users/2/role').set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
  });

  it('200 when role is "user"', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).patch('/api/admin/users/2/role').set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    expect(res.status).toBe(200);
  });

  it('404 when user not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).patch('/api/admin/users/99999/role').set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    expect(res.status).toBe(404);
  });
});

// ── Admin Booking Status ──────────────────────────────────────────────────────

describe('PATCH /api/admin/bookings/:id/status', () => {
  it('400 when status is invalid', async () => {
    const res = await request(app).patch('/api/admin/bookings/1/status').set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'refunded' });
    expect(res.status).toBe(400);
  });

  it('400 when booking already has that status', async () => {
    mockConn.query.mockResolvedValueOnce([[{ id: 1, status: 'confirmed', showtime_id: 1 }]]);
    const res = await request(app).patch('/api/admin/bookings/1/status').set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already confirmed/i);
  });

  it('404 when booking not found', async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // booking not found
    const res = await request(app).patch('/api/admin/bookings/999/status').set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
  });

  it('200 on valid status change to cancelled', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 1, status: 'confirmed', showtime_id: 1 }]])
      .mockResolvedValueOnce([{}])                // UPDATE booking
      .mockResolvedValueOnce([[{ cnt: 2 }]])      // seat count
      .mockResolvedValueOnce([{}]);               // UPDATE available_seats
    const res = await request(app).patch('/api/admin/bookings/1/status').set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
  });
});
