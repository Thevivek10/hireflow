import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingWithdrawId, setPendingWithdrawId] = useState(null);

  useEffect(() => {
    axios.get('/api/applications/my')
      .then(r => setApplications(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const withdrawApplication = async (appId) => {
    try {
      await axios.delete(`/api/applications/${appId}`);
      setApplications(apps => apps.filter(a => a._id !== appId));
      toast.success('Application withdrawn');
    } catch (err) {
      toast.error('Failed to withdraw application');
    }
    setPendingWithdrawId(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#111111';
    if (score >= 60) return '#30323a';
    if (score >= 40) return '#5a5f67';
    return '#8b8f97';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Applications</h1>
            <p style={styles.sub}>{applications.length} applications submitted</p>
          </div>
          <Link to="/jobs"><button className="btn-primary">Browse More Jobs →</button></Link>
        </div>

        {applications.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 56 }}>📋</span>
            <h2>No applications yet</h2>
            <p>Start by browsing open positions</p>
            <Link to="/jobs"><button className="btn-primary" style={{ marginTop: 12 }}>Browse Jobs</button></Link>
          </div>
        ) : (
          <div style={styles.list}>
            {applications.map(app => (
              <div key={app._id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.cardTop}>
                    <span style={styles.category}>{app.jobId?.category}</span>
                    <span className={`badge badge-${app.jobId?.status}`}>{app.jobId?.status}</span>
                  </div>
                  <h2 style={styles.jobTitle}>{app.jobId?.title}</h2>
                  <p style={styles.company}>{app.jobId?.company}</p>
                  <p style={styles.location}>📍 {app.jobId?.location}</p>

                  <div style={styles.meta}>
                    <span className={`badge badge-${app.status}`}>Application: {app.status}</span>
                    <span style={styles.time}>{formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}</span>
                  </div>
                </div>

                <div style={styles.cardRight}>
                  <div style={styles.scoreSection}>
                    <div style={styles.scoreLabel}>🤖 AI Score</div>
                    <div style={{ ...styles.scoreValue, color: getScoreColor(app.aiScore) }}>
                      {app.aiScore}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
                    </div>
                    <div className="score-bar" style={{ width: 100 }}>
                      <div className="score-fill" style={{ width: `${app.aiScore}%`, background: getScoreColor(app.aiScore) }} />
                    </div>
                    {app.aiRank && (
                      <div style={styles.rankInfo}>Ranked #{app.aiRank}</div>
                    )}
                  </div>

                  <div style={styles.actions}>
                    <Link to={`/jobs/${app.jobId?._id}`}>
                      <button style={styles.viewBtn}>View</button>
                    </Link>
                    <button
                      type="button"
                      style={styles.withdrawBtn}
                      onClick={() => setPendingWithdrawId(app._id)}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Withdraw confirmation modal */}
        <ConfirmModal
          open={!!pendingWithdrawId}
          title="Withdraw application"
          message="Are you sure you want to withdraw this application? The employer will no longer see your CV for this job."
          confirmLabel="Yes, withdraw"
          cancelLabel="Keep application"
          onCancel={() => setPendingWithdrawId(null)}
          onConfirm={() => withdrawApplication(pendingWithdrawId)}
        />
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', marginTop: 4 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px',
    display: 'flex',
    gap: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cardLeft: { flex: 1, minWidth: 250, textAlign: 'left' },
  cardTop: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 },
  category: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--text)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6,
  },
  jobTitle: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  company: { color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 4 },
  location: { color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 },
  meta: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  time: { color: 'var(--text-muted)', fontSize: 12 },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  scoreSection: { textAlign: 'right' },
  scoreLabel: { color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  scoreValue: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, lineHeight: 1 },
  rankInfo: { color: 'var(--text)', fontSize: 12, fontWeight: 600, marginTop: 6 },
  viewBtn: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  withdrawBtn: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)',
  },
};
