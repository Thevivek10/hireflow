const request = require('supertest');

jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../models/Job', () => ({ findById: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../models/Application', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const app = require('../app');
const { loginAs, employer, applicant } = require('./helpers');

const openJob = { _id: 'j1', title: 'Dev', company: 'Acme', description: 'd', requirements: 'r', status: 'open' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('POST /api/applications/:jobId', () => {
  const apply = (auth) => request(app).post('/api/applications/j1').set('Authorization', auth);

  it('requires authentication', async () => {
    const res = await request(app).post('/api/applications/j1').send({});
    expect(res.status).toBe(401);
  });

  it('forbids employers from applying', async () => {
    const res = await apply(loginAs(User, employer)).send({ cvText: 'cv' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when the job does not exist', async () => {
    Job.findById.mockResolvedValue(null);
    const res = await apply(loginAs(User, applicant)).send({ cvText: 'cv' });
    expect(res.status).toBe(404);
  });

  it('rejects applications to a closed job', async () => {
    Job.findById.mockResolvedValue({ ...openJob, status: 'closed' });
    const res = await apply(loginAs(User, applicant)).send({ cvText: 'cv' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not accepting/i);
  });

  it('rejects duplicate applications', async () => {
    Job.findById.mockResolvedValue(openJob);
    Application.findOne.mockResolvedValue({ _id: 'existing' });
    const res = await apply(loginAs(User, applicant)).send({ cvText: 'cv' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already applied/i);
  });

  it('creates the application, bumps the applicant count and re-ranks', async () => {
    Job.findById.mockResolvedValue(openJob);
    Job.findByIdAndUpdate.mockResolvedValue({});
    Application.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue({
      _id: 'a1', aiAnalysis: 'x', toObject() { return { _id: 'a1', status: 'pending' }; },
    });
    Application.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'a1' }]) });
    Application.findByIdAndUpdate.mockResolvedValue({});

    const res = await apply(loginAs(User, applicant)).send({ cvText: 'Node.js developer' });

    expect(res.status).toBe(201);
    // No GEMINI_API_KEY in tests, so scoring falls back to 0 instead of failing.
    expect(res.body.aiScore).toBe(0);
    expect(Job.findByIdAndUpdate).toHaveBeenCalledWith('j1', { $inc: { applicantCount: 1 } });
    expect(Application.findByIdAndUpdate).toHaveBeenCalledWith('a1', { aiRank: 1 });
  });
});

describe('PUT /api/applications/:id/status', () => {
  const populated = (ownerId) => ({
    status: 'pending',
    jobId: { userId: { toString: () => ownerId } },
    save: jest.fn().mockResolvedValue(),
  });

  it('returns 404 for an unknown application', async () => {
    Application.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const res = await request(app).put('/api/applications/a1/status').set('Authorization', loginAs(User, employer)).send({ status: 'hired' });
    expect(res.status).toBe(404);
  });

  it('forbids an employer who does not own the job', async () => {
    const doc = populated('someone-else');
    Application.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(doc) });
    const res = await request(app).put('/api/applications/a1/status').set('Authorization', loginAs(User, employer)).send({ status: 'hired' });
    expect(res.status).toBe(403);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('lets the owning employer change the status', async () => {
    const doc = populated('emp1');
    Application.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(doc) });
    const res = await request(app).put('/api/applications/a1/status').set('Authorization', loginAs(User, employer)).send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(doc.status).toBe('shortlisted');
    expect(doc.save).toHaveBeenCalled();
  });
});

describe('GET /api/applications/my', () => {
  it('returns the signed-in applicant\'s applications', async () => {
    const sort = jest.fn().mockResolvedValue([{ _id: 'a1' }]);
    Application.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort }) });
    const res = await request(app).get('/api/applications/my').set('Authorization', loginAs(User, applicant));
    expect(res.status).toBe(200);
    expect(Application.find).toHaveBeenCalledWith({ applicantId: 'app1' });
    expect(res.body).toHaveLength(1);
  });
});
