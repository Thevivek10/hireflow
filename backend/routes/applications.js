const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Activity = require('../models/Activity');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/cvs';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
}});

// AI scoring function (currently disabled while migrating to Gemini)
async function scoreCV(cvText, jobDescription, jobRequirements, jobTitle) {
  return {
    score: 0,
    analysis: 'AI scoring temporarily disabled',
    strengths: [],
    gaps: [],
  };
}

// Re-rank all applications for a job
async function reRankApplications(jobId) {
  const apps = await Application.find({ jobId }).sort({ aiScore: -1 });
  for (let i = 0; i < apps.length; i++) {
    await Application.findByIdAndUpdate(apps[i]._id, { aiRank: i + 1 });
  }
}

// GET my applications (applicant)
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate('jobId', 'title company status category location')
      .sort({ appliedAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST apply to job
router.post('/:jobId', auth, upload.single('cv'), async (req, res) => {
  if (req.user.role !== 'applicant') return res.status(403).json({ error: 'Only applicants can apply' });

  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Job is not accepting applications' });

    const existing = await Application.findOne({ jobId: req.params.jobId, applicantId: req.user._id });
    if (existing) return res.status(400).json({ error: 'Already applied to this job' });

    let cvText = req.body.cvText || ''; // text from AI-generated CV
    let cvPath = '';
    
    if (req.file) {
      cvPath = req.file.path;
      // Try to extract text from uploaded file
      try {
        if (req.file.mimetype === 'application/pdf') {
          const pdfParse = require('pdf-parse');
          const dataBuffer = fs.readFileSync(req.file.path);
          const pdfData = await pdfParse(dataBuffer);
          cvText = pdfData.text;
        } else if (req.file.originalname.endsWith('.txt')) {
          cvText = fs.readFileSync(req.file.path, 'utf-8');
        }
      } catch (e) {
        console.error('PDF parsing error:', e);
      }
    }

    // Parse cvData if provided
    let cvData = {};
    if (req.body.cvData) {
      try { cvData = JSON.parse(req.body.cvData); } catch(e) {}
    }

    // AI Score
    const aiResult = cvText ? await scoreCV(cvText, job.description, job.requirements, job.title) : { score: 0, analysis: 'No CV text available' };

    const application = await Application.create({
      jobId: req.params.jobId,
      applicantId: req.user._id,
      coverLetter: req.body.coverLetter,
      cvPath,
      cvText,
      cvData,
      aiScore: aiResult.score,
      aiAnalysis: `${aiResult.analysis} Strengths: ${(aiResult.strengths || []).join(', ')}. Areas to improve: ${(aiResult.gaps || []).join(', ')}.`,
      status: 'pending'
    });

    // Update job applicant count
    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicantCount: 1 } });

    // Re-rank all applications
    await reRankApplications(req.params.jobId);

    await Activity.create({
      userId: req.user._id,
      entityId: application._id,
      entityType: 'application',
      action: `Applied to: ${job.title} at ${job.company}`
    });

    res.status(201).json({ ...application.toObject(), aiScore: aiResult.score, aiAnalysis: application.aiAnalysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update application status (employer)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.jobId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    application.status = req.body.status;
    await application.save();

    await Activity.create({
      userId: req.user._id,
      entityId: application._id,
      entityType: 'application',
      action: `Application status changed to ${req.body.status}`
    });

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE application (employer removes applicant)
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const isEmployer = application.jobId.userId.toString() === req.user._id.toString();
    const isApplicant = application.applicantId.toString() === req.user._id.toString();
    if (!isEmployer && !isApplicant) return res.status(403).json({ error: 'Not authorized' });

    if (application.cvPath && fs.existsSync(application.cvPath)) {
      fs.unlinkSync(application.cvPath);
    }

    await Application.findByIdAndDelete(req.params.id);
    await Job.findByIdAndUpdate(application.jobId._id, { $inc: { applicantCount: -1 } });
    await reRankApplications(application.jobId._id);

    await Activity.create({
      userId: req.user._id,
      entityId: application._id,
      entityType: 'application',
      action: `Removed application from ${application.jobId.title}`
    });

    res.json({ message: 'Application removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CV for an application (employer only)
router.get('/:id/cv', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (application.jobId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Prefer uploaded file if available
    if (application.cvPath && fs.existsSync(application.cvPath)) {
      return res.sendFile(path.resolve(application.cvPath));
    }

    // Otherwise return JSON view of AI-generated CV or extracted text
    if (application.cvData && Object.keys(application.cvData).length > 0) {
      return res.json({ type: 'ai', cvData: application.cvData, cvText: application.cvText || null });
    }

    if (application.cvText) {
      return res.json({ type: 'text', cvText: application.cvText });
    }

    return res.status(404).json({ error: 'No CV available for this application' });
  } catch (err) {
    console.error('Error fetching CV:', err);
    res.status(500).json({ error: 'Failed to fetch CV' });
  }
});

module.exports = router;
