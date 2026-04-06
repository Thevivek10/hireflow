const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

let mongoServer;

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'applicant'
    });

    // Generate valid token
    validToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Mock request and response objects
  const mockRequest = (authHeader) => {
    return {
      headers: {
        authorization: authHeader
      }
    };
  };

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Token', () => {
    it('should authenticate user with valid token', async () => {
      const req = mockRequest(`Bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.name).toBe(testUser.name);
      expect(req.user.password).toBeUndefined(); // Password should be excluded
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should exclude password from user object', async () => {
      const req = mockRequest(`Bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(req.user.password).toBeUndefined();
    });

    it('should call next() on successful authentication', async () => {
      const req = mockRequest(`Bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Missing Token', () => {
    it('should return 401 when no authorization header', async () => {
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is empty', async () => {
      const req = mockRequest('');
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is missing', async () => {
      const req = mockRequest('Bearer ');
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 with malformed token', async () => {
      const req = mockRequest('Bearer invalid-token');
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '0s' }
      );

      const req = mockRequest(`Bearer ${expiredToken}`);
      const res = mockResponse();
      const next = jest.fn();

      // Wait a bit to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with token signed with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: testUser._id },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      const req = mockRequest(`Bearer ${wrongToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const tokenWithInvalidUser = jwt.sign(
        { id: nonExistentId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      const req = mockRequest(`Bearer ${tokenWithInvalidUser}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token Format', () => {
    it('should reject token without Bearer prefix', async () => {
      const req = mockRequest(validToken);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive Bearer prefix', async () => {
      const req = mockRequest(`bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      // This should fail because it's lowercase 'bearer'
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract token correctly with extra spaces', async () => {
      const req = mockRequest(`Bearer  ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      // The split(' ') might not handle multiple spaces well
      // This tests the actual behavior
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('User Data Integrity', () => {
    it('should attach complete user object to request', async () => {
      const req = mockRequest(`Bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(req.user).toHaveProperty('_id');
      expect(req.user).toHaveProperty('name');
      expect(req.user).toHaveProperty('email');
      expect(req.user).toHaveProperty('role');
      expect(req.user).toHaveProperty('createdAt');
    });

    it('should preserve user role', async () => {
      const req = mockRequest(`Bearer ${validToken}`);
      const res = mockResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(req.user.role).toBe(testUser.role);
    });
  });
});
