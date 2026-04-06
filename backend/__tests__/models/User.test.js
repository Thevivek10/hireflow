const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

let mongoServer;

describe('User Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'applicant'
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBeDefined();
    });

    it('should default role to applicant if not specified', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.role).toBe('applicant');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.email).toBe('test@example.com');
    });

    it('should trim name field', async () => {
      const userData = {
        name: '  John Doe  ',
        email: 'john2@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.name).toBe('John Doe');
    });

    it('should fail to create user without required fields', async () => {
      const userData = {
        name: 'Test User'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await User.create(userData);

      const duplicateUser = {
        name: 'User Two',
        email: 'duplicate@example.com',
        password: 'password456'
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('should only accept employer or applicant roles', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should accept employer role', async () => {
      const userData = {
        name: 'Employer User',
        email: 'employer@example.com',
        password: 'password123',
        role: 'employer'
      };

      const user = await User.create(userData);
      expect(user.role).toBe('employer');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const userData = {
        name: 'Hash Test',
        email: 'hash@example.com',
        password: 'plaintext123'
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe('plaintext123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'nohash@example.com',
        password: 'password123'
      });

      const originalHash = user.password;
      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password when modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'rehash@example.com',
        password: 'password123'
      });

      const originalHash = user.password;
      user.password = 'newpassword456';
      await user.save();

      expect(user.password).not.toBe(originalHash);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword123';
      const user = await User.create({
        name: 'Test User',
        email: 'compare@example.com',
        password
      });

      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'compare2@example.com',
        password: 'correctPassword123'
      });

      const isMatch = await user.comparePassword('wrongPassword456');
      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'CaseSensitive123';
      const user = await User.create({
        name: 'Test User',
        email: 'case@example.com',
        password
      });

      const isMatchLower = await user.comparePassword('casesensitive123');
      expect(isMatchLower).toBe(false);

      const isMatchCorrect = await user.comparePassword(password);
      expect(isMatchCorrect).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should require name field', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email field', async () => {
      const userData = {
        name: 'No Email',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password field', async () => {
      const userData = {
        name: 'No Password',
        email: 'nopass@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email uniqueness', async () => {
      await User.create({
        name: 'First User',
        email: 'unique@example.com',
        password: 'password123'
      });

      await expect(User.create({
        name: 'Second User',
        email: 'unique@example.com',
        password: 'password456'
      })).rejects.toThrow();
    });
  });
});
