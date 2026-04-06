const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jobsRoutes = require('../../routes/jobs');
const Job = require('../../models/Job');
const User = require('../../models/User');
const Application = require('../../models/Application');
const Activity = require('../../models/Activity');
const jwt = require('jsonwebtoken');

let mongoServer;
let app;
let employerToken;
let applicantToken;
let employer;
let applicant;

describe('Jobs Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/jobs', jobsRoutes);

    // Create test users
    employer = await User.create({
      name: 'Test Employer',
      email: 'employer@test.com',
      password: 'password123',
      role: 'employer'
    });

    applicant = await User.create({
      name: 'Test Applicant',
      email: 'applicant@test.com',
      password: 'password123',
      role: 'applicant'
    });

    // Generate tokens
    employerToken = jwt.sign({ id: employer._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    applicantToken = jwt.sign({ id: applicant._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Activity.deleteMany({});
  });

  describe('GET /api/jobs', () => {
    beforeEach(async () => {
      // Create test jobs
      await Job.create([
        {
          userId: employer._id,
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'Build amazing software',
          requirements: 'JavaScript, React',
          category: 'Technology',
          location: 'Remote',
          status: 'open'
        },
        {
          userId: employer._id,
          title: 'Marketing Manager',
          company: 'Marketing Inc',
          description: 'Lead marketing campaigns',
          requirements: 'Marketing experience',
          category: 'Marketing',
          location: 'New York',
          status: 'open'
        },
        {
          userId: employer._id,
          title: 'Senior Developer',
          company: 'Tech Corp',
          description: 'Lead development team',
          requirements: 'Python, Django',
          category: 'Technology',
          location: 'Remote',
          status: 'closed'
        }
      ]);
    });

    it('should return all jobs', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(200);

      expect(response.body.jobs).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should filter by search query', async () => {
      const response = await request(app)
        .get('/api/jobs?search=Software')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toBe('Software Engineer');
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/jobs?category=Technology')
        .expect(200);

      expect(response.body.jobs).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/jobs?status=closed')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].status).toBe('closed');
    });

    it('should filter by location', async () => {
      const response = await request(app)
        .get('/api/jobs?location=Remote')
        .expect(200);

      expect(response.body.jobs).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/jobs?page=1&limit=2')
        .expect(200);

      expect(response.body.jobs).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.pages).toBe(2);
    });

    it('should sort by oldest first', async () => {
      const response = await request(app)
        .get('/api/jobs?sort=oldest')
        .expect(200);

      const firstJob = response.body.jobs[0];
      const lastJob = response.body.jobs[response.body.jobs.length - 1];
      expect(new Date(firstJob.createdAt).getTime()).toBeLessThanOrEqual(new Date(lastJob.createdAt).getTime());
    });

    it('should populate user info', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .expect(200);

      expect(response.body.jobs[0].userId).toHaveProperty('name');
      expect(response.body.jobs[0].userId).toHaveProperty('email');
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/jobs?category=Technology&status=open&location=Remote')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toBe('Software Engineer');
    });
  });

  describe('GET /api/jobs/my', () => {
    beforeEach(async () => {
      await Job.create({
        userId: employer._id,
        title: 'My Job Posting',
        company: 'My Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      });
    });

    it('should return employer\'s own jobs', async () => {
      const response = await request(app)
        .get('/api/jobs/my')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('My Job Posting');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/jobs/my')
        .expect(401);
    });

    it('should return empty array if employer has no jobs', async () => {
      // Create another employer
      const newEmployer = await User.create({
        name: 'New Employer',
        email: 'new@employer.com',
        password: 'password123',
        role: 'employer'
      });
      const newToken = jwt.sign({ id: newEmployer._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const response = await request(app)
        .get('/api/jobs/my')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await Job.create({
        userId: employer._id,
        title: 'Test Job',
        company: 'Test Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      });
    });

    it('should return job by id', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}`)
        .expect(200);

      expect(response.body.title).toBe('Test Job');
      expect(response.body.company).toBe('Test Company');
    });

    it('should populate user info', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}`)
        .expect(200);

      expect(response.body.userId).toHaveProperty('name');
      expect(response.body.userId.email).toBe(employer.email);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('POST /api/jobs', () => {
    it('should create a new job as employer', async () => {
      const jobData = {
        title: 'New Job',
        company: 'New Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology',
        location: 'Remote'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.title).toBe(jobData.title);
      expect(response.body.company).toBe(jobData.company);
      expect(response.body.userId.toString()).toBe(employer._id.toString());
    });

    it('should create activity log on job creation', async () => {
      const jobData = {
        title: 'Activity Test Job',
        company: 'Test Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      };

      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData)
        .expect(201);

      const activities = await Activity.find();
      expect(activities).toHaveLength(1);
      expect(activities[0].action).toContain('Posted job');
    });

    it('should return 403 if applicant tries to create job', async () => {
      const jobData = {
        title: 'New Job',
        company: 'New Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(jobData)
        .expect(403);

      expect(response.body.error).toBe('Only employers can post jobs');
    });

    it('should return 401 without token', async () => {
      const jobData = {
        title: 'New Job',
        company: 'New Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      };

      await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const jobData = {
        title: 'New Job'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await Job.create({
        userId: employer._id,
        title: 'Original Title',
        company: 'Original Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      });
    });

    it('should update job successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'closed'
      };

      const response = await request(app)
        .put(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.status).toBe('closed');
    });

    it('should create activity log on update', async () => {
      const updateData = { title: 'Updated Title' };

      await request(app)
        .put(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(updateData)
        .expect(200);

      const activities = await Activity.find();
      expect(activities).toHaveLength(1);
      expect(activities[0].action).toContain('Updated job');
    });

    it('should return 403 if not job owner', async () => {
      const otherEmployer = await User.create({
        name: 'Other Employer',
        email: 'other@employer.com',
        password: 'password123',
        role: 'employer'
      });
      const otherToken = jwt.sign({ id: otherEmployer._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const response = await request(app)
        .put(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.error).toBe('Not authorized');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await Job.create({
        userId: employer._id,
        title: 'Job to Delete',
        company: 'Test Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      });

      // Create applications for this job
      await Application.create([
        { jobId: testJob._id, applicantId: applicant._id },
        { jobId: testJob._id, applicantId: applicant._id }
      ]);
    });

    it('should delete job successfully', async () => {
      const response = await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Job deleted');

      const deletedJob = await Job.findById(testJob._id);
      expect(deletedJob).toBeNull();
    });

    it('should cascade delete applications', async () => {
      await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const applications = await Application.find({ jobId: testJob._id });
      expect(applications).toHaveLength(0);
    });

    it('should create activity log on delete', async () => {
      await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const activities = await Activity.find();
      expect(activities).toHaveLength(1);
      expect(activities[0].action).toContain('Deleted job');
    });

    it('should return 403 if not job owner', async () => {
      const otherEmployer = await User.create({
        name: 'Other Employer',
        email: 'other2@employer.com',
        password: 'password123',
        role: 'employer'
      });
      const otherToken = jwt.sign({ id: otherEmployer._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const response = await request(app)
        .delete(`/api/jobs/${testJob._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.error).toBe('Not authorized');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET /api/jobs/:id/applicants', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await Job.create({
        userId: employer._id,
        title: 'Job with Applicants',
        company: 'Test Company',
        description: 'Job description',
        requirements: 'Requirements',
        category: 'Technology'
      });

      // Create applications with different AI scores
      await Application.create([
        { jobId: testJob._id, applicantId: applicant._id, aiScore: 85 },
        { jobId: testJob._id, applicantId: applicant._id, aiScore: 90 },
        { jobId: testJob._id, applicantId: applicant._id, aiScore: 70 }
      ]);
    });

    it('should return applicants sorted by AI score', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}/applicants`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].aiScore).toBe(90);
      expect(response.body[1].aiScore).toBe(85);
      expect(response.body[2].aiScore).toBe(70);
    });

    it('should populate applicant info', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob._id}/applicants`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      expect(response.body[0].applicantId).toHaveProperty('name');
      expect(response.body[0].applicantId).toHaveProperty('email');
    });

    it('should return 403 if not job owner', async () => {
      const otherEmployer = await User.create({
        name: 'Other Employer',
        email: 'other3@employer.com',
        password: 'password123',
        role: 'employer'
      });
      const otherToken = jwt.sign({ id: otherEmployer._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const response = await request(app)
        .get(`/api/jobs/${testJob._id}/applicants`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.error).toBe('Not authorized');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/jobs/${fakeId}/applicants`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });
});
