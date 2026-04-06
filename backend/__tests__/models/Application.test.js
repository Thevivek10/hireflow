const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');

let mongoServer;
let testEmployer;
let testApplicant;
let testJob;

describe('Application Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    testEmployer = await User.create({
      name: 'Test Employer',
      email: 'employer@test.com',
      password: 'password123',
      role: 'employer'
    });

    testApplicant = await User.create({
      name: 'Test Applicant',
      email: 'applicant@test.com',
      password: 'password123',
      role: 'applicant'
    });

    // Create test job
    testJob = await Job.create({
      userId: testEmployer._id,
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Job description',
      requirements: 'JavaScript, React',
      category: 'Technology'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Application.deleteMany({});
  });

  describe('Application Creation', () => {
    it('should create a new application with valid data', async () => {
      const applicationData = {
        jobId: testJob._id,
        applicantId: testApplicant._id,
        coverLetter: 'I am very interested in this position',
        cvPath: '/uploads/cv/test.pdf',
        cvText: 'CV content here'
      };

      const application = await Application.create(applicationData);

      expect(application._id).toBeDefined();
      expect(application.jobId.toString()).toBe(testJob._id.toString());
      expect(application.applicantId.toString()).toBe(testApplicant._id.toString());
      expect(application.coverLetter).toBe(applicationData.coverLetter);
      expect(application.cvPath).toBe(applicationData.cvPath);
      expect(application.cvText).toBe(applicationData.cvText);
      expect(application.status).toBe('pending');
      expect(application.aiScore).toBe(0);
      expect(application.appliedAt).toBeDefined();
      expect(application.updatedAt).toBeDefined();
    });

    it('should default status to pending', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      expect(application.status).toBe('pending');
    });

    it('should default aiScore to 0', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      expect(application.aiScore).toBe(0);
    });

    it('should accept AI-generated CV data', async () => {
      const cvData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        summary: 'Experienced developer',
        experience: [
          {
            company: 'Tech Inc',
            role: 'Developer',
            duration: '2020-2023',
            description: 'Built web applications'
          }
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            year: '2020'
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js']
      };

      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        cvData
      });

      expect(application.cvData.name).toBe(cvData.name);
      expect(application.cvData.email).toBe(cvData.email);
      expect(application.cvData.phone).toBe(cvData.phone);
      expect(application.cvData.summary).toBe(cvData.summary);
      expect(application.cvData.experience).toHaveLength(1);
      expect(application.cvData.experience[0].company).toBe('Tech Inc');
      expect(application.cvData.education).toHaveLength(1);
      expect(application.cvData.skills).toEqual(cvData.skills);
    });

    it('should accept AI scoring data', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        aiScore: 85,
        aiAnalysis: 'Strong candidate with relevant experience',
        aiRank: 1
      });

      expect(application.aiScore).toBe(85);
      expect(application.aiAnalysis).toBe('Strong candidate with relevant experience');
      expect(application.aiRank).toBe(1);
    });
  });

  describe('Required Fields', () => {
    it('should fail without jobId', async () => {
      const applicationData = {
        applicantId: testApplicant._id
      };

      await expect(Application.create(applicationData)).rejects.toThrow();
    });

    it('should fail without applicantId', async () => {
      const applicationData = {
        jobId: testJob._id
      };

      await expect(Application.create(applicationData)).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

    validStatuses.forEach(status => {
      it(`should accept ${status} as a valid status`, async () => {
        const application = await Application.create({
          jobId: testJob._id,
          applicantId: testApplicant._id,
          status
        });

        expect(application.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const applicationData = {
        jobId: testJob._id,
        applicantId: testApplicant._id,
        status: 'invalid-status'
      };

      await expect(Application.create(applicationData)).rejects.toThrow();
    });
  });

  describe('Pre-save Hook', () => {
    it('should update updatedAt timestamp on save', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      const originalUpdatedAt = application.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      application.status = 'reviewed';
      await application.save();

      expect(application.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Reference Population', () => {
    it('should populate job reference', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      const populatedApp = await Application.findById(application._id).populate('jobId');

      expect(populatedApp.jobId.title).toBe(testJob.title);
      expect(populatedApp.jobId.company).toBe(testJob.company);
    });

    it('should populate applicant reference', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      const populatedApp = await Application.findById(application._id).populate('applicantId');

      expect(populatedApp.applicantId.email).toBe(testApplicant.email);
      expect(populatedApp.applicantId.name).toBe(testApplicant.name);
    });

    it('should populate both job and applicant references', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id
      });

      const populatedApp = await Application.findById(application._id)
        .populate('jobId')
        .populate('applicantId');

      expect(populatedApp.jobId.title).toBe(testJob.title);
      expect(populatedApp.applicantId.email).toBe(testApplicant.email);
    });
  });

  describe('Complex CV Data Scenarios', () => {
    it('should handle multiple experiences', async () => {
      const cvData = {
        experience: [
          { company: 'Company A', role: 'Junior Dev', duration: '2018-2020', description: 'Desc A' },
          { company: 'Company B', role: 'Mid Dev', duration: '2020-2022', description: 'Desc B' },
          { company: 'Company C', role: 'Senior Dev', duration: '2022-2024', description: 'Desc C' }
        ]
      };

      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        cvData
      });

      expect(application.cvData.experience).toHaveLength(3);
      expect(application.cvData.experience[1].company).toBe('Company B');
    });

    it('should handle multiple education entries', async () => {
      const cvData = {
        education: [
          { institution: 'High School', degree: 'Diploma', year: '2014' },
          { institution: 'University', degree: 'BS', year: '2018' },
          { institution: 'Graduate School', degree: 'MS', year: '2020' }
        ]
      };

      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        cvData
      });

      expect(application.cvData.education).toHaveLength(3);
      expect(application.cvData.education[2].degree).toBe('MS');
    });

    it('should handle large skill arrays', async () => {
      const skills = [
        'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
        'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis',
        'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git'
      ];

      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        cvData: { skills }
      });

      expect(application.cvData.skills).toHaveLength(15);
      expect(application.cvData.skills).toContain('Kubernetes');
    });
  });

  describe('AI Score Boundaries', () => {
    it('should accept AI score of 0', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        aiScore: 0
      });

      expect(application.aiScore).toBe(0);
    });

    it('should accept AI score of 100', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        aiScore: 100
      });

      expect(application.aiScore).toBe(100);
    });

    it('should accept fractional AI scores', async () => {
      const application = await Application.create({
        jobId: testJob._id,
        applicantId: testApplicant._id,
        aiScore: 87.5
      });

      expect(application.aiScore).toBe(87.5);
    });
  });
});
