import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: params.get('role') || 'applicant'
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://hireflow-hz8e.onrender.com'
  : '/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/register`, form);
      login(data.token, data.user);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Join HireFlow today</p>

        {/* Role Toggle */}
        <div style={styles.roleToggle}>
          {['applicant', 'employer'].map(role => (
            <button key={role} onClick={() => setForm({...form, role})}
              style={{ ...styles.roleBtn, ...(form.role === role ? styles.roleBtnActive : {}) }}>
              {role === 'applicant' ? '🔍 Job Seeker' : '🏢 Employer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="John Doe" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="At least 6 characters" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'var(--bg)',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
  },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 },
  roleToggle: {
    display: 'flex',
    background: 'var(--surface2)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    border: '1px solid var(--border)',
  },
  roleBtn: {
    flex: 1,
    padding: '9px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  roleBtnActive: {
    background: 'var(--text)',
    color: 'var(--bg)',
  },
  submitBtn: { width: '100%', padding: '12px', fontSize: 15 },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' },
  link: { color: 'var(--text)', fontWeight: 600, textDecoration: 'underline' },
};
