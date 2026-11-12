const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));

const User = require('../models/User');
const app = require('../app');
const { loginAs, employer } = require('./helpers');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  const valid = { name: 'Alex', email: 'alex@example.com', password: 'secret1', role: 'applicant' };

  it.each([
    ['invalid email', { ...valid, email: 'not-an-email' }],
    ['short password', { ...valid, password: '123' }],
    ['unknown role', { ...valid, role: 'admin' }],
    ['missing name', { ...valid, name: '' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(User.create).not.toHaveBeenCalled();
  });

  it('rejects an email that is already registered', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('creates the user and returns a signed JWT', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: 'u1' });

    const res = await request(app).post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ id: 'u1', name: 'Alex', role: 'applicant' });
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe('u1');
  });
});

describe('POST /api/auth/login', () => {
  it('rejects a malformed request with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad', password: '' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when the user does not exist', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong password', async () => {
    User.findOne.mockResolvedValue({ comparePassword: jest.fn().mockResolvedValue(false) });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns a token and user on success', async () => {
    User.findOne.mockResolvedValue({
      _id: 'u2', name: 'Eve', role: 'employer',
      comparePassword: jest.fn().mockResolvedValue(true),
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'eve@example.com', password: 'secret1' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'u2', role: 'employer' });
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe('u2');
  });
});

describe('auth middleware via GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token/i);
  });

  it('returns 401 for a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is valid but the user no longer exists', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const token = jwt.sign({ id: 'ghost' }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', loginAs(User, employer));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: 'emp1', role: 'employer' });
  });
});
