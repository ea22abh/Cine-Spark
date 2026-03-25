process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NODE_ENV = 'test';

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));
