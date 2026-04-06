const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Job = require('../../models/Job');
const User = require('../../models/User');

let mongoServer;
let testUser;

describe('Job Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test user for job creation
    testUser = await User.create({
      name: 'Test Employer',
      email: 'employer@test.com',
      password: 'password123',
      role: 'employer'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Job.deleteMany({});
  });

  describe('Job Creation', () => {
    it('should create a new job with valid data', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'We are looking for a skilled software engineer',
        requirements: 'JavaScript, React, Node.js',
        category: 'Technology',
        location: 'Remote',
        salary: '$80,000 - $120,000'
      };

      const job = await Job.create(jobData);

      expect(job._id).toBeDefined();
      expect(job.userId.toString()).toBe(testUser._id.toString());
      expect(job.title).toBe(jobData.title);
      expect(job.company).toBe(jobData.company);
      expect(job.description).toBe(jobData.description);
      expect(job.requirements).toBe(jobData.requirements);
      expect(job.category).toBe(jobData.category);
      expect(job.location).toBe(jobData.location);
      expect(job.salary).toBe(jobData.salary);
      expect(job.status).toBe('open');
      expect(job.applicantCount).toBe(0);
      expect(job.createdAt).toBeDefined();
      expect(job.updatedAt).toBeDefined();
    });

    it('should default location to Remote if not specified', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      const job = await Job.create(jobData);
      expect(job.location).toBe('Remote');
    });

    it('should default status to open', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      const job = await Job.create(jobData);
      expect(job.status).toBe('open');
    });

    it('should default applicantCount to 0', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      const job = await Job.create(jobData);
      expect(job.applicantCount).toBe(0);
    });

    it('should trim title and company fields', async () => {
      const jobData = {
        userId: testUser._id,
        title: '  Software Engineer  ',
        company: '  Tech Corp  ',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      const job = await Job.create(jobData);
      expect(job.title).toBe('Software Engineer');
      expect(job.company).toBe('Tech Corp');
    });

    it('should accept deadline date', async () => {
      const deadline = new Date('2024-12-31');
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology',
        deadline
      };

      const job = await Job.create(jobData);
      expect(job.deadline).toEqual(deadline);
    });
  });

  describe('Required Fields', () => {
    it('should fail without userId', async () => {
      const jobData = {
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });

    it('should fail without title', async () => {
      const jobData = {
        userId: testUser._id,
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });

    it('should fail without company', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });

    it('should fail without description', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        requirements: 'Skills required',
        category: 'Technology'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });

    it('should fail without requirements', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        category: 'Technology'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });

    it('should fail without category', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });
  });

  describe('Category Validation', () => {
    const validCategories = [
      'Technology', 'Marketing', 'Finance', 'Healthcare',
      'Education', 'Design', 'Engineering', 'Sales', 'HR', 'Other'
    ];

    validCategories.forEach(category => {
      it(`should accept ${category} as a valid category`, async () => {
        const jobData = {
          userId: testUser._id,
          title: 'Test Job',
          company: 'Test Corp',
          description: 'Job description',
          requirements: 'Skills required',
          category
        };

        const job = await Job.create(jobData);
        expect(job.category).toBe(category);
      });
    });

    it('should reject invalid category', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'InvalidCategory'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    it('should accept open status', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology',
        status: 'open'
      };

      const job = await Job.create(jobData);
      expect(job.status).toBe('open');
    });

    it('should accept closed status', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology',
        status: 'closed'
      };

      const job = await Job.create(jobData);
      expect(job.status).toBe('closed');
    });

    it('should accept paused status', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology',
        status: 'paused'
      };

      const job = await Job.create(jobData);
      expect(job.status).toBe('paused');
    });

    it('should reject invalid status', async () => {
      const jobData = {
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology',
        status: 'invalid'
      };

      await expect(Job.create(jobData)).rejects.toThrow();
    });
  });

  describe('Pre-save Hook', () => {
    it('should update updatedAt timestamp on save', async () => {
      const job = await Job.create({
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      });

      const originalUpdatedAt = job.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      job.title = 'Senior Developer';
      await job.save();

      expect(job.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Reference', () => {
    it('should populate user reference', async () => {
      const job = await Job.create({
        userId: testUser._id,
        title: 'Developer',
        company: 'Tech Inc',
        description: 'Job description',
        requirements: 'Skills required',
        category: 'Technology'
      });

      const populatedJob = await Job.findById(job._id).populate('userId');

      expect(populatedJob.userId.email).toBe(testUser.email);
      expect(populatedJob.userId.name).toBe(testUser.name);
    });
  });
});
