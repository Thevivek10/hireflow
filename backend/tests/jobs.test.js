const request = require('supertest');

jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../models/Job', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/Application', () => ({ find: jest.fn(), deleteMany: jest.fn() }));
jest.mock('../models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const app = require('../app');
const { loginAs, employer, applicant } = require('./helpers');

const validJob = {
  title: 'Backend Developer', company: 'Acme', description: 'Build APIs',
  requirements: 'Node.js', category: 'Technology',
};

// Builds the chain Job.find().populate().sort().skip().limit()
const listChain = (result) => {
  const chain = {};
  chain.populate = jest.fn().mockReturnValue(chain);
  chain.sort = jest.fn().mockReturnValue(chain);
  chain.skip = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue(result);
  return chain;
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/jobs', () => {
  it('applies filters, sorting and pagination', async () => {
    const chain = listChain([{ title: 'A' }]);
    Job.countDocuments.mockResolvedValue(25);
    Job.find.mockReturnValue(chain);

    const res = await request(app).get('/api/jobs?category=Technology&sort=applicants&page=2&limit=10');

    expect(res.status).toBe(200);
    expect(Job.find).toHaveBeenCalledWith({ category: 'Technology' });
    expect(chain.sort).toHaveBeenCalledWith({ applicantCount: -1 });
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(res.body).toMatchObject({ total: 25, pages: 3, currentPage: 2 });
  });

  it('builds a case-insensitive search across title, company and description', async () => {
    Job.countDocuments.mockResolvedValue(0);
    Job.find.mockReturnValue(listChain([]));

    await request(app).get('/api/jobs?search=node');

    const query = Job.find.mock.calls[0][0];
    expect(query.$or).toHaveLength(3);
    expect(query.$or[0].title.$options).toBe('i');
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns 404 for an unknown job', async () => {
    Job.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get('/api/jobs/abc');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/jobs', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/jobs').send(validJob);
    expect(res.status).toBe(401);
  });

  it('forbids applicants from posting jobs (role-based access control)', async () => {
    const res = await request(app).post('/api/jobs').set('Authorization', loginAs(User, applicant)).send(validJob);
    expect(res.status).toBe(403);
    expect(Job.create).not.toHaveBeenCalled();
  });

  it('validates required fields for employers', async () => {
    const res = await request(app).post('/api/jobs').set('Authorization', loginAs(User, employer)).send({ title: 'Only a title' });
    expect(res.status).toBe(400);
    expect(Job.create).not.toHaveBeenCalled();
  });

  it('lets an employer create a job owned by themselves', async () => {
    Job.create.mockResolvedValue({ _id: 'j1', ...validJob });
    const res = await request(app).post('/api/jobs').set('Authorization', loginAs(User, employer)).send(validJob);
    expect(res.status).toBe(201);
    expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({ ...validJob, userId: 'emp1' }));
  });
});

describe('PUT and DELETE /api/jobs/:id ownership', () => {
  const otherEmployersJob = { _id: 'j9', title: 'X', userId: { toString: () => 'someone-else' } };
  const myJob = { _id: 'j1', title: 'Mine', userId: { toString: () => 'emp1' } };

  it('returns 404 when updating a missing job', async () => {
    Job.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/jobs/j1').set('Authorization', loginAs(User, employer)).send({ title: 'New' });
    expect(res.status).toBe(404);
  });

  it('forbids updating a job owned by someone else', async () => {
    Job.findById.mockResolvedValue(otherEmployersJob);
    const res = await request(app).put('/api/jobs/j9').set('Authorization', loginAs(User, employer)).send({ title: 'Hack' });
    expect(res.status).toBe(403);
    expect(Job.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updates a job the employer owns', async () => {
    Job.findById.mockResolvedValue(myJob);
    Job.findByIdAndUpdate.mockResolvedValue({ ...myJob, title: 'Updated' });
    const res = await request(app).put('/api/jobs/j1').set('Authorization', loginAs(User, employer)).send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('forbids deleting a job owned by someone else', async () => {
    Job.findById.mockResolvedValue(otherEmployersJob);
    const res = await request(app).delete('/api/jobs/j9').set('Authorization', loginAs(User, employer));
    expect(res.status).toBe(403);
    expect(Job.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('deletes the job together with its applications', async () => {
    Job.findById.mockResolvedValue(myJob);
    Application.deleteMany.mockResolvedValue({});
    Job.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app).delete('/api/jobs/j1').set('Authorization', loginAs(User, employer));
    expect(res.status).toBe(200);
    expect(Application.deleteMany).toHaveBeenCalledWith({ jobId: 'j1' });
    expect(Job.findByIdAndDelete).toHaveBeenCalledWith('j1');
  });
});

describe('GET /api/jobs/:id/applicants', () => {
  it('returns applicants sorted by AI score for the job owner', async () => {
    Job.findById.mockResolvedValue({ _id: 'j1', userId: { toString: () => 'emp1' } });
    const sort = jest.fn().mockResolvedValue([{ aiScore: 90 }, { aiScore: 40 }]);
    Application.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort }) });

    const res = await request(app).get('/api/jobs/j1/applicants').set('Authorization', loginAs(User, employer));

    expect(res.status).toBe(200);
    expect(sort).toHaveBeenCalledWith({ aiScore: -1 });
    expect(res.body).toHaveLength(2);
  });

  it('forbids other employers from viewing applicants', async () => {
    Job.findById.mockResolvedValue({ _id: 'j1', userId: { toString: () => 'someone-else' } });
    const res = await request(app).get('/api/jobs/j1/applicants').set('Authorization', loginAs(User, employer));
    expect(res.status).toBe(403);
  });
});
