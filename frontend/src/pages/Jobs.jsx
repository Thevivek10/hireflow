import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Design', 'Engineering', 'Sales', 'HR', 'Other'];

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('open');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://hireflow-hz8e.onrender.com'
  : '/api';
  
  useEffect(() => {
    fetchJobs();
  }, [search, category, status, sort, page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category, status, sort, page, limit: 9 });
      const { data } = await axios.get(`${API_BASE}/api/jobs?${params}`);
      setJobs(data.jobs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Job Listings</h1>
            <p style={styles.sub}>{total} positions available</p>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <input
            placeholder="🔍  Search jobs, companies..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={styles.searchInput}
          />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={styles.select}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={styles.select}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={styles.select}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="applicants">Most Applicants</option>
          </select>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <p>No jobs found matching your criteria.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map(job => (
              <JobCard key={job._id} job={job} user={user} navigate={navigate} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={styles.pagination}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, user, navigate }) {
  return (
    <div style={styles.jobCard}>
      <div style={styles.cardTop}>
        <div>
          <span style={styles.categoryChip}>{job.category}</span>
          <span className={`badge badge-${job.status}`} style={{ marginLeft: 8 }}>{job.status}</span>
        </div>
        <span style={styles.time}>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
      </div>
      <h3 style={styles.jobTitle}>{job.title}</h3>
      <p style={styles.company}>{job.company}</p>
      <p style={styles.location}>📍 {job.location}</p>
      {job.salary && <p style={styles.salary}>💰 {job.salary}</p>}
      <p style={styles.desc}>{job.description.substring(0, 120)}...</p>
      <div style={styles.cardBottom}>
        <span style={styles.applicants}>👥 {job.applicantCount} applicants</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/jobs/${job._id}`)} style={styles.viewJobBtn}>
            View Details
          </button>
          {user?.role === 'applicant' && job.status === 'open' && (
            <button onClick={() => navigate(`/apply/${job._id}`)} style={styles.applyBtn}>
              Apply →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', marginTop: 4 },
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1 1 280px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '11px 16px',
    borderRadius: 10,
    fontSize: 14,
    minWidth: 0,
  },
  select: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '11px 14px',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
  },
  jobCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: '0.2s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--text)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6,
  },
  time: { color: 'var(--text-muted)', fontSize: 12 },
  jobTitle: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  company: { color: 'var(--text)', fontWeight: 600, fontSize: 14 },
  location: { color: 'var(--text-muted)', fontSize: 13 },
  salary: { color: 'var(--text)', fontSize: 13, fontWeight: 600 },
  desc: { color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, flex: 1 },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8, paddingTop: 16,
    borderTop: '1px solid var(--border)',
  },
  applicants: { color: 'var(--text-muted)', fontSize: 13 },
  viewJobBtn: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  applyBtn: {
    background: 'var(--text)',
    color: 'var(--bg)',
    padding: '7px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, padding: '80px 24px', color: 'var(--text-muted)',
  },
  pagination: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 },
  pageBtn: {
    width: 36, height: 36,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  pageBtnActive: { background: 'var(--text)', borderColor: 'var(--text)', color: 'var(--bg)' },
};
