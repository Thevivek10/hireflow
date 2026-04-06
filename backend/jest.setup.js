// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

// Increase timeout for database operations
jest.setTimeout(10000);
