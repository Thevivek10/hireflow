import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Applicants() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cvModal, setCvModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        axios.get(`/api/jobs/${id}`),
        axios.get(`/api/jobs/${id}/applicants`)
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      setApplications(apps => apps.map(a => a._id === appId ? { ...a, status } : a));
      if (selected?._id === appId) setSelected(s => ({ ...s, status }));
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const removeApplicant = async (appId) => {
    if (!window.confirm('Remove this applicant?')) return;
    try {
      await axios.delete(`/api/applications/${appId}`);
      setApplications(apps => apps.filter(a => a._id !== appId));
      if (selected?._id === appId) setSelected(null);
      toast.success('Applicant removed');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const viewCv = (app) => {
    // If there is an uploaded CV file, open it in a new tab via the secured API route
    if (app.cvPath) {
      window.open(`/api/applications/${app._id}/cv`, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise, show AI-generated / text CV in the in-app modal
    if (app.cvData || app.cvText) {
      setCvModal(app);
    } else {
      toast.error('No CV available for this applicant');
    }
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
        {/* Header */}
        <div style={styles.header}>
          <div>
            <Link to="/dashboard" style={styles.breadLink}>← Dashboard</Link>
            <h1 style={styles.title}>{job?.title}</h1>
            <p style={styles.sub}>{job?.company} · {applications.length} applicants (AI-ranked)</p>
          </div>
          <Link to={`/edit-job/${id}`}>
            <button className="btn-secondary">Edit Job</button>
          </Link>
        </div>

        {/* AI Scoring Notice */}
        <div style={styles.aiNotice}>
          <span style={styles.aiIcon}>🤖</span>
          <div>
            <strong style={{ color: 'var(--text)' }}>AI Auto-Ranking Active</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              Candidates are automatically scored and ranked by AI based on how well their CV matches your job requirements. Higher rank = better match.
            </p>
          </div>
        </div>

        <div style={styles.layout}>
          {/* Applicant List */}
          <div style={styles.list}>
            {applications.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p>No applications yet</p>
              </div>
            ) : (
              applications.map((app, idx) => (
                <div key={app._id}
                  style={{ ...styles.appCard, ...(selected?._id === app._id ? styles.appCardActive : {}) }}
                  onClick={() => setSelected(app)}>
                  <div style={styles.appRank}>
                    <span style={{ ...styles.rankBadge, background: idx < 3 ? 'var(--text)' : 'var(--surface2)', color: idx < 3 ? 'var(--bg)' : 'var(--text)' }}>
                      #{app.aiRank || idx + 1}
                    </span>
                    {idx === 0 && <span style={styles.topBadge}>Top</span>}
                  </div>
                  <div style={styles.appInfo}>
                    <h3 style={styles.appName}>{app.applicantId?.name}</h3>
                    <p style={styles.appEmail}>{app.applicantId?.email}</p>
                    <p style={styles.appTime}>{formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}</p>
                  </div>
                  <div style={styles.appRight}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); viewCv(app); }}
                      className="btn-secondary"
                      style={{ marginBottom: 8, padding: '4px 10px', fontSize: 11 }}
                    >
                      View CV
                    </button>
                    <div style={styles.scoreCircle}>
                      <span style={{ ...styles.scoreNum, color: getScoreColor(app.aiScore) }}>
                        {app.aiScore}
                      </span>
                      <span style={styles.scoreLabel}>/ 100</span>
                    </div>
                    <div style={styles.scoreBarWrap}>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${app.aiScore}%`, background: getScoreColor(app.aiScore) }} />
                      </div>
                    </div>
                    <span className={`badge badge-${app.status}`}>{app.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={styles.detail}>
              <div className="card">
                <div style={styles.detailHeader}>
                  <div>
                    <h2 style={styles.detailName}>{selected.applicantId?.name}</h2>
                    <p style={styles.detailEmail}>{selected.applicantId?.email}</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={styles.closeBtn}>✕</button>
                </div>

                {/* AI Score */}
                <div style={styles.scoreCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>🤖 AI Compatibility Score</span>
                    <span style={{ ...styles.bigScore, color: getScoreColor(selected.aiScore) }}>
                      {selected.aiScore}/100
                    </span>
                  </div>
                  <div className="score-bar" style={{ height: 8, borderRadius: 4 }}>
                    <div className="score-fill" style={{ width: `${selected.aiScore}%`, background: getScoreColor(selected.aiScore), borderRadius: 4 }} />
                  </div>
                </div>

                {/* AI Analysis */}
                {selected.aiAnalysis && (
                  <div style={styles.section}>
                    <h4 style={styles.secTitle}>🤖 AI Analysis</h4>
                    <p style={styles.secText}>{selected.aiAnalysis}</p>
                  </div>
                )}

                {/* CV Data */}
                {selected.cvData?.summary && (
                  <div style={styles.section}>
                    <h4 style={styles.secTitle}>Professional Summary</h4>
                    <p style={styles.secText}>{selected.cvData.summary}</p>
                  </div>
                )}

                {selected.cvData?.skills?.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.secTitle}>Skills</h4>
                    <div style={styles.skills}>
                      {selected.cvData.skills.map((s, i) => (
                        <span key={i} style={styles.skill}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.cvData?.experience?.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.secTitle}>Experience</h4>
                    {selected.cvData.experience.map((exp, i) => (
                      <div key={i} style={styles.expItem}>
                        <strong style={{ color: 'var(--text)' }}>{exp.role}</strong>
                        <span style={{ color: 'var(--text)' }}> at {exp.company}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> ({exp.duration})</span>
                        {exp.description && <p style={styles.expDesc}>{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {selected.coverLetter && (
                  <div style={styles.section}>
                    <h4 style={styles.secTitle}>Cover Letter</h4>
                    <p style={styles.secText}>{selected.coverLetter}</p>
                  </div>
                )}

                {/* Status Actions */}
                <div style={styles.section}>
                  <h4 style={styles.secTitle}>Update Status</h4>
                  <div style={styles.statusBtns}>
                    {['shortlisted', 'reviewed', 'hired', 'rejected'].map(s => (
                      <button key={s} onClick={() => updateStatus(selected._id, s)}
                        style={{ ...styles.statusBtn, ...(selected.status === s ? styles.statusBtnActive : {}) }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => removeApplicant(selected._id)} className="btn-danger" style={{ width: '100%', marginTop: 8 }}>
                  🗑️ Remove Applicant
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CV Modal */}
        {cvModal && (
          <div style={styles.modalBackdrop} onClick={() => setCvModal(null)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>CV Preview</h3>
                  <p style={styles.modalSub}>
                    {cvModal.applicantId?.name} · {cvModal.applicantId?.email}
                  </p>
                </div>
                <button onClick={() => setCvModal(null)} style={styles.closeBtn}>✕</button>
              </div>

              {cvModal.cvData && (
                <>
                  {cvModal.cvData.summary && (
                    <div style={styles.section}>
                      <h4 style={styles.secTitle}>Summary</h4>
                      <p style={styles.secText}>{cvModal.cvData.summary}</p>
                    </div>
                  )}

                  {cvModal.cvData.experience?.length > 0 && (
                    <div style={styles.section}>
                      <h4 style={styles.secTitle}>Experience</h4>
                      {cvModal.cvData.experience.map((exp, i) => (
                        <div key={i} style={styles.expItem}>
                          <strong style={{ color: 'var(--text)' }}>{exp.role}</strong>
                          <span style={{ color: 'var(--text)' }}> at {exp.company}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> ({exp.duration})</span>
                          {exp.description && <p style={styles.expDesc}>{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {cvModal.cvData.skills?.length > 0 && (
                    <div style={styles.section}>
                      <h4 style={styles.secTitle}>Skills</h4>
                      <div style={styles.skills}>
                        {cvModal.cvData.skills.map((s, i) => (
                          <span key={i} style={styles.skill}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {cvModal.cvText && (
                <div style={styles.section}>
                  <h4 style={styles.secTitle}>Full CV Text</h4>
                  <pre style={styles.cvTextBlock}>{cvModal.cvText}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 1200, margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 16, marginBottom: 24,
  },
  breadLink: { color: 'var(--text)', fontSize: 13, display: 'block', marginBottom: 8, textDecoration: 'underline' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', marginTop: 4 },
  aiNotice: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  aiIcon: { fontSize: 24, flexShrink: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  appCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    cursor: 'pointer',
    transition: '0.15s',
  },
  appCardActive: { border: '1px solid var(--text)', background: '#fafafa' },
  appRank: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', flexShrink: 0 },
  rankBadge: {
    width: 36, height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Syne, sans-serif',
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--bg)',
  },
  topBadge: { fontSize: 10, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.2px' },
  appInfo: { flex: 1, minWidth: 0 },
  appName: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  appEmail: { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 },
  appTime: { color: 'var(--text-muted)', fontSize: 11, marginTop: 4 },
  appRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, minWidth: 100 },
  scoreCircle: { display: 'flex', alignItems: 'baseline', gap: 2 },
  scoreNum: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 },
  scoreLabel: { color: 'var(--text-muted)', fontSize: 12 },
  scoreBarWrap: { width: 80 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  detail: { position: 'sticky', top: 80 },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailName: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  detailEmail: { color: 'var(--text-muted)', fontSize: 13, marginTop: 4 },
  closeBtn: { background: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6 },
  scoreCard: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  bigScore: { fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800 },
  section: { marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' },
  secTitle: { color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  secText: { color: '#30323a', fontSize: 13, lineHeight: 1.7 },
  skills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skill: { background: 'var(--surface2)', color: 'var(--text)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  expItem: { marginBottom: 10, fontSize: 13 },
  expDesc: { color: 'var(--text-muted)', marginTop: 4, fontSize: 12, lineHeight: 1.5 },
  statusBtns: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  statusBtnActive: { background: 'var(--text)', borderColor: 'var(--text)', color: 'var(--bg)' },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 14,
    border: '1px solid var(--border)',
    maxWidth: 720,
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    padding: 20,
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text)',
  },
  modalSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  cvTextBlock: {
    background: 'var(--surface2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    maxHeight: '40vh',
    overflow: 'auto',
  },
};
