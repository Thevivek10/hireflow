const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const Activity = require('../../models/Activity');

let mongoServer;
let app;

describe('Auth Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Activity.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should create activity log on registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'applicant'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const activities = await Activity.find();
      expect(activities).toHaveLength(1);
      expect(activities[0].action).toBe('User registered');
      expect(activities[0].entityType).toBe('user');
    });

    it('should register employer successfully', async () => {
      const userData = {
        name: 'Employer Name',
        email: 'employer@company.com',
        password: 'securepass',
        role: 'employer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('employer');
    });

    it('should return 400 if email already exists', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'applicant'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const duplicateUser = {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'password456',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email already registered');
    });

    it('should return 400 if name is missing', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'password123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 if email is invalid', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 if password is too short', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 if role is invalid', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should normalize email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should trim name whitespace', async () => {
      const userData = {
        name: '  John Doe  ',
        email: 'trim@example.com',
        password: 'password123',
        role: 'applicant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.name).toBe('John Doe');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'applicant'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(credentials.email);
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 with incorrect password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 if email is invalid format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 if password is empty', async () => {
      const credentials = {
        email: 'test@example.com',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should be case-insensitive for email', async () => {
      const credentials = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should generate valid JWT token', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Auth Test User',
        email: 'authtest@example.com',
        password: 'password123',
        role: 'applicant'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123'
        });

      token = response.body.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('authtest@example.com');
      expect(response.body.name).toBe('Auth Test User');
      expect(response.body.role).toBe('applicant');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.password).toBeUndefined();
    });
  });

  describe('Token Generation', () => {
    it('should generate different tokens for different users', async () => {
      const user1 = {
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
        role: 'applicant'
      };

      const user2 = {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'employer'
      };

      const response1 = await request(app)
        .post('/api/auth/register')
        .send(user1)
        .expect(201);

      const response2 = await request(app)
        .post('/api/auth/register')
        .send(user2)
        .expect(201);

      expect(response1.body.token).not.toBe(response2.body.token);
    });
  });
});
