const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Activity = require('../models/Activity');

// GET all jobs (public - with search/filter/sort)
router.get('/', async (req, res) => {
  try {
    const { search, category, status, location, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = { $regex: location, $options: 'i' };

    const sortObj = {};
    if (sort === 'oldest') sortObj.createdAt = 1;
    else if (sort === 'applicants') sortObj.applicantCount = -1;
    else sortObj.createdAt = -1;

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('userId', 'name email')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ jobs, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my jobs (employer)
router.get('/my', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('userId', 'name email');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create job (employer only)
router.post('/', auth, [
  body('title').notEmpty(),
  body('company').notEmpty(),
  body('description').notEmpty(),
  body('requirements').notEmpty(),
  body('category').notEmpty()
], async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employers can post jobs' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const job = await Job.create({ ...req.body, userId: req.user._id });
    await Activity.create({ userId: req.user._id, entityId: job._id, entityType: 'job', action: `Posted job: ${job.title}` });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update job
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

    const updated = await Job.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    await Activity.create({ userId: req.user._id, entityId: job._id, entityType: 'job', action: `Updated job: ${job.title}` });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

    await Application.deleteMany({ jobId: job._id });
    await Job.findByIdAndDelete(req.params.id);
    await Activity.create({ userId: req.user._id, entityId: job._id, entityType: 'job', action: `Deleted job: ${job.title}` });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET applicants for a job (employer only)
router.get('/:id/applicants', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

    const applications = await Application.find({ jobId: req.params.id })
      .populate('applicantId', 'name email')
      .sort({ aiScore: -1 }); // sorted by AI score

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
