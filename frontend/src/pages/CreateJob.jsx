import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Design', 'Engineering', 'Sales', 'HR', 'Other'];

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', company: '', description: '', requirements: '',
    category: '', location: 'Remote', salary: '', status: 'open', deadline: ''
  });
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://hireflow-hz8e.onrender.com'
  : '/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/jobs`, form);
      toast.success('Job posted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Post a New Job</h1>
        <p style={styles.sub}>Fill in the details below. The more specific you are, the better AI can match candidates.</p>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 style={styles.section}>Basic Information</h2>
            <div style={styles.grid2}>
              <div className="form-group">
                <label>Job Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Senior React Developer" required />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  placeholder="Your company name" required />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Remote / City, Country" />
              </div>
              <div className="form-group">
                <label>Salary Range</label>
                <input value={form.salary} onChange={e => setForm({...form, salary: e.target.value})}
                  placeholder="e.g. $80,000 - $120,000" />
              </div>
              <div className="form-group">
                <label>Application Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Describe the role, responsibilities, team culture..." rows={6} required />
            </div>

            <div className="form-group">
              <label>Requirements & Qualifications *</label>
              <textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
                placeholder="List required skills, experience level, qualifications... (AI uses this to score CVs)" rows={6} required />
            </div>

            <div style={styles.aiTip}>
              <span>🤖</span>
              <p>AI will use your Job Description and Requirements to automatically score and rank every applicant's CV. Be specific for best results.</p>
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Posting...' : '🚀 Post Job'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 800, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 8 },
  sub: { color: 'var(--text-muted)', marginBottom: 28 },
  section: { fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 },
  aiTip: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 18px',
    marginTop: 8,
    color: 'var(--text)',
    fontSize: 13,
  },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 },
};
