const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String },
  cvPath: { type: String },
  cvText: { type: String }, // extracted text from PDF
  cvData: {
    // AI-generated CV fields
    name: String,
    email: String,
    phone: String,
    summary: String,
    experience: [{ company: String, role: String, duration: String, description: String }],
    education: [{ institution: String, degree: String, year: String }],
    skills: [String]
  },
  aiScore: { type: Number, default: 0 }, // AI shortlisting score 0-100
  aiAnalysis: { type: String }, // AI analysis text
  aiRank: { type: Number }, // rank among applicants for this job
  status: { type: String, enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
