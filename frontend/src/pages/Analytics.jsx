import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#111111', '#30323a', '#5a5f67', '#8b8f97', '#c7c9cf', '#dedfe3', '#f2f2f4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--text)', fontWeight: 600, fontSize: 14 }}>
            {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://hireflow-hz8e.onrender.com'
  : '/api';

  useEffect(() => {
    axios.get(`${API_BASE}/api/analytics`)
      .then(r => { setData(r.data); generateInsights(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const generateInsights = async (analyticsData) => {
    setInsightLoading(true);
    try {
      const { data: insights } = await axios.post(`${API_BASE}/api/ai/insights`, { applications: analyticsData });
      setInsights(insights);
    } catch (err) {
      console.error('Insights failed');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>No data yet.</p>;

  const statusData = data.statusBreakdown?.map(s => ({ name: s._id, value: s.count })) || [];
  const categoryData = data.categoryBreakdown?.map(c => ({ name: c._id, value: c.count })) || [];

  const insightColors = { strength: '#111111', improvement: '#5a5f67', opportunity: '#30323a' };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Analytics</h1>
        <p style={styles.sub}>{user.role === 'employer' ? 'Hiring pipeline insights' : 'Your career journey insights'}</p>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {user.role === 'employer' ? (
            <>
              <StatCard label="Total Jobs" value={data.totalJobs} icon="💼" />
              <StatCard label="Open Jobs" value={data.openJobs} icon="🟢" />
              <StatCard label="Total Applications" value={data.totalApplications} icon="👥" />
              <StatCard label="Avg AI Score" value={`${data.avgAiScore}/100`} icon="🤖" />
            </>
          ) : (
            <>
              <StatCard label="Applications" value={data.totalApplications} icon="📋" />
              <StatCard label="Avg AI Score" value={`${data.avgAiScore}/100`} icon="🤖" />
            </>
          )}
        </div>

        <div style={styles.chartsGrid}>
          {/* Application Status */}
          {statusData.length > 0 && (
            <div className="card">
              <h3 style={styles.chartTitle}>Application Status Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({name, value}) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <div className="card">
              <h3 style={styles.chartTitle}>{user.role === 'employer' ? 'Jobs by Category' : 'Applications by Category'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeeef" />
                  <XAxis dataKey="name" tick={{ fill: '#5b5f67', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#5b5f67', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Applications over time */}
          {data.appsByDay?.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={styles.chartTitle}>Applications Over Time (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.appsByDay} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeeef" />
                  <XAxis dataKey="_id" tick={{ fill: '#5b5f67', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#5b5f67', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#111111" strokeWidth={2} dot={{ fill: '#111111', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={styles.chartTitle}>🤖 AI Career Insights</h3>
          {insightLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Generating insights...</div>
          ) : insights.length > 0 ? (
            <div style={styles.insightsGrid}>
              {insights.map((insight, i) => (
                <div key={i} style={{ ...styles.insightCard, borderLeft: `3px solid ${insightColors[insight.type] || '#111111'}` }}>
                  <h4 style={{ ...styles.insightTitle, color: insightColors[insight.type] || '#111111' }}>
                    {insight.type === 'strength' ? '✅' : insight.type === 'improvement' ? '⚠️' : '💡'} {insight.title}
                  </h4>
                  <p style={styles.insightDesc}>{insight.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Apply to jobs to generate AI insights about your career journey.</p>
          )}
        </div>

        {/* Activity Log */}
        {data.recentActivity?.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={styles.chartTitle}>Recent Activity</h3>
            <div style={styles.activityList}>
              {data.recentActivity.map((activity, i) => (
                <div key={i} style={styles.activityItem}>
                  <span style={styles.actDot} />
                  <div style={{ flex: 1 }}>
                    <p style={styles.actText}>{activity.action}</p>
                    <p style={styles.actTime}>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 24px', minHeight: 'calc(100vh - 64px)' },
  container: { maxWidth: 1100, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub: { color: 'var(--text-muted)', marginBottom: 32 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  chartTitle: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  insightCard: { background: 'var(--surface2)', borderRadius: 10, padding: '16px 20px', borderLeft: '3px solid #111111' },
  insightTitle: { fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 8 },
  insightDesc: { color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 },
  activityList: { display: 'flex', flexDirection: 'column', gap: 0 },
  activityItem: {
    display: 'flex', gap: 16, alignItems: 'flex-start',
    padding: '12px 0', borderBottom: '1px solid var(--border)',
  },
  actDot: { width: 8, height: 8, borderRadius: '50%', background: '#111111', marginTop: 5, flexShrink: 0 },
  actText: { color: 'var(--text)', fontSize: 14 },
  actTime: { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 },
};
