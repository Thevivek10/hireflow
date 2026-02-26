const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  category: { type: String, required: true, enum: ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Design', 'Engineering', 'Sales', 'HR', 'Other'] },
  location: { type: String, default: 'Remote' },
  salary: { type: String },
  status: { type: String, enum: ['open', 'closed', 'paused'], default: 'open' },
  deadline: { type: Date },
  applicantCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);
