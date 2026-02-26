import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://hireflow-hz8e.onrender.com'
  : '/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user.role === 'employer') {
        const { data } = await axios.get(`${API_BASE}/api/jobs/my`);
        setJobs(data);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This will remove all applications.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/jobs/${id}`);
      setJobs(jobs.filter(j => j._id !== id));
      toast.success('Job deleted');
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.sub}>Welcome back, {user.name} 👋</p>
          </div>
          {user.role === 'employer' && (
            <Link to="/create-job">
              <button className="btn-primary">+ Post New Job</button>
            </Link>
          )}
          {user.role === 'applicant' && (
            <Link to="/jobs">
              <button className="btn-primary">Browse Jobs →</button>
            </Link>
          )}
        </div>

        {user.role === 'employer' && (
          <>
            {/* Stats */}
            <div style={styles.statsGrid}>
              <StatCard label="Total Jobs" value={jobs.length} icon="💼" color="#111111" />
              <StatCard label="Open Jobs" value={jobs.filter(j => j.status === 'open').length} icon="🟢" color="#30323a" />
              <StatCard label="Total Applicants" value={jobs.reduce((a, j) => a + j.applicantCount, 0)} icon="👥" color="#5a5f67" />
              <StatCard label="Closed Jobs" value={jobs.filter(j => j.status === 'closed').length} icon="🔒" color="#8b8f97" />
            </div>

            {/* Jobs Table */}
            <div className="card" style={{ marginTop: 24 }}>
              <div style={styles.tableHeader}>
                <h2 style={styles.tableTitle}>Your Job Postings</h2>
                <Link to="/analytics" style={{ color: 'var(--text)', fontSize: 13, textDecoration: 'underline' }}>View Analytics →</Link>
              </div>
              {jobs.length === 0 ? (
                <div style={styles.empty}>
                  <span style={{ fontSize: 40 }}>💼</span>
                  <p>No jobs posted yet. <Link to="/create-job" style={{ color: 'var(--text)', textDecoration: 'underline' }}>Post your first job →</Link></p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Job', 'Category', 'Status', 'Applicants', 'Posted', 'Actions'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job._id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.jobName}>{job.title}</div>
                            <div style={styles.jobCompany}>{job.company} · {job.location}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.categoryTag}>{job.category}</span>
                          </td>
                          <td style={styles.td}>
                            <span className={`badge badge-${job.status}`}>{job.status}</span>
                          </td>
                          <td style={styles.td}>
                            <Link to={`/jobs/${job._id}/applicants`} style={styles.applicantCount}>
                              👥 {job.applicantCount}
                            </Link>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actions}>
                              <Link to={`/jobs/${job._id}/applicants`}>
                                <button style={styles.viewBtn}>View Applicants</button>
                              </Link>
                              <Link to={`/edit-job/${job._id}`}>
                                <button style={styles.editBtn}>Edit</button>
                              </Link>
                              <button className="btn-danger" onClick={() => deleteJob(job._id, job.title)}
                                style={{ padding: '6px 12px', fontSize: 12 }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {user.role === 'applicant' && (
          <div style={styles.applicantWelcome}>
            <div style={styles.welcomeCard}>
              <span style={{ fontSize: 48 }}>🚀</span>
              <h2 style={styles.welcomeTitle}>Ready to find your next role?</h2>
              <p style={styles.welcomeDesc}>Browse open positions, apply with an AI-generated CV, and track all your applications in one place.</p>
              <div style={styles.welcomeActions}>
                <Link to="/jobs"><button className="btn-primary" style={{ padding: '12px 28px' }}>Browse All Jobs</button></Link>
                <Link to="/my-applications"><button className="btn-secondary" style={{ padding: '12px 28px' }}>My Applications</button></Link>
                <Link to="/analytics"><button className="btn-secondary" style={{ padding: '12px 28px' }}>My Analytics</button></Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 1200, margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 16, marginBottom: 32,
  },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', marginTop: 4 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  tableTitle: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '10px 12px',
    color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 12px', verticalAlign: 'middle' },
  jobName: { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  jobCompany: { color: 'var(--text-muted)', fontSize: 12 },
  categoryTag: {
    background: 'var(--surface2)',
    color: 'var(--text)',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  applicantCount: {
    color: 'var(--text)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  viewBtn: {
    background: 'var(--surface2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  editBtn: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  applicantWelcome: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 0',
  },
  welcomeCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '60px 48px',
    textAlign: 'center',
    maxWidth: 600,
  },
  welcomeTitle: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, margin: '20px 0 12px', color: 'var(--text)' },
  welcomeDesc: { color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 },
  welcomeActions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
};
