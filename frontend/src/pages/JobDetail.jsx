import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!job) return null;

  const isOwner = user && job.userId._id === user._id;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link to="/jobs" style={styles.breadLink}>← Back to Jobs</Link>
        </div>

        <div style={styles.layout}>
          {/* Main */}
          <div style={styles.main}>
            <div className="card">
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.categoryChip}>{job.category}</span>
                  <span className={`badge badge-${job.status}`} style={{ marginLeft: 8 }}>{job.status}</span>
                </div>
                <span style={styles.time}>
                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
              </div>

              <h1 style={styles.title}>{job.title}</h1>
              <h2 style={styles.company}>{job.company}</h2>

              <div style={styles.meta}>
                <span>📍 {job.location}</span>
                {job.salary && <span>💰 {job.salary}</span>}
                {job.deadline && <span>⏰ Deadline: {format(new Date(job.deadline), 'MMM dd, yyyy')}</span>}
                <span>👥 {job.applicantCount} applicants</span>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Job Description</h3>
                <p style={styles.text}>{job.description}</p>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Requirements</h3>
                <p style={styles.text}>{job.requirements}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div className="card">
              <h3 style={styles.sideTitle}>Apply for this role</h3>
              {!user ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>Sign in to apply</p>
                  <Link to="/login"><button className="btn-primary" style={{ width: '100%' }}>Sign In to Apply</button></Link>
                </div>
              ) : isOwner ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>You posted this job</p>
                  <Link to={`/jobs/${id}/applicants`}>
                    <button className="btn-primary" style={{ width: '100%', marginBottom: 8 }}>
                      View Applicants ({job.applicantCount})
                    </button>
                  </Link>
                  <Link to={`/edit-job/${id}`}>
                    <button className="btn-secondary" style={{ width: '100%' }}>Edit Job</button>
                  </Link>
                </div>
              ) : user.role === 'applicant' && job.status === 'open' ? (
                <div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                    Our AI will instantly score your CV and rank you among other applicants.
                  </p>
                  <Link to={`/apply/${id}`}>
                    <button className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                      Apply Now — AI CV Builder →
                    </button>
                  </Link>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>This job is {job.status}.</p>
              )}

              <div style={styles.postedBy}>
                <p style={styles.postedLabel}>Posted by</p>
                <p style={styles.postedName}>{job.userId.name}</p>
                <p style={styles.postedEmail}>{job.userId.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 1100, margin: '0 auto' },
  breadcrumb: { marginBottom: 24 },
  breadLink: { color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'underline' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' },
  main: {},
  sidebar: {},
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryChip: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--text)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6,
  },
  time: { color: 'var(--text-muted)', fontSize: 13 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 },
  company: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 },
  meta: { display: 'flex', gap: 20, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 12 },
  text: { color: '#30323a', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  sideTitle: { fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text)' },
  postedBy: { marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' },
  postedLabel: { color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 },
  postedName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  postedEmail: { color: 'var(--text-muted)', fontSize: 13, marginTop: 2 },
};
