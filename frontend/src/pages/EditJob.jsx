import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Design', 'Engineering', 'Sales', 'HR', 'Other'];

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(r => setForm(r.data))
      .catch(() => navigate('/dashboard'));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/jobs/${id}`, form);
      toast.success('Job updated!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Edit Job</h1>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div style={styles.grid2}>
              <div className="form-group">
                <label>Job Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="open">Open</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Salary</label>
                <input value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={6} required />
            </div>
            <div className="form-group">
              <label>Requirements</label>
              <textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} rows={6} required />
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
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
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 28 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 },
};
