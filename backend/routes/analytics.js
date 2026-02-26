const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Activity = require('../models/Activity');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const isEmployer = req.user.role === 'employer';

    if (isEmployer) {
      const myJobs = await Job.find({ userId });
      const jobIds = myJobs.map(j => j._id);

      const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });
      const statusBreakdown = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const categoryBreakdown = await Job.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      const recentActivity = await Activity.find({ userId }).sort({ timestamp: -1 }).limit(10);
      
      // Applications over time (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const appsByDay = await Application.aggregate([
        { $match: { jobId: { $in: jobIds }, appliedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      const avgScore = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: null, avg: { $avg: '$aiScore' } } }
      ]);

      res.json({
        totalJobs: myJobs.length,
        openJobs: myJobs.filter(j => j.status === 'open').length,
        totalApplications,
        statusBreakdown,
        categoryBreakdown,
        appsByDay,
        recentActivity,
        avgAiScore: avgScore[0]?.avg?.toFixed(1) || 0
      });
    } else {
      // Applicant analytics
      const myApps = await Application.find({ applicantId: userId }).populate('jobId', 'title category');
      const statusBreakdown = await Application.aggregate([
        { $match: { applicantId: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const recentActivity = await Activity.find({ userId }).sort({ timestamp: -1 }).limit(10);
      
      const avgScore = myApps.reduce((acc, a) => acc + (a.aiScore || 0), 0) / (myApps.length || 1);

      res.json({
        totalApplications: myApps.length,
        statusBreakdown,
        avgAiScore: avgScore.toFixed(1),
        recentActivity,
        topScored: myApps.sort((a, b) => b.aiScore - a.aiScore).slice(0, 5)
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
