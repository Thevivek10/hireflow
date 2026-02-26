import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="nav-shell">
      <nav className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand">
            <span className="nav__brand-mark">HF</span>
            <div className="nav__brand-copy">
              <span className="nav__brand-title">HireFlow</span>
              <span className="nav__brand-subtitle">Job pipeline, without the chaos</span>
            </div>
          </Link>

          <button
            className="nav__menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
          </button>

          <div className={`nav__links ${menuOpen ? 'nav__links--open' : ''}`}>
            <Link to="/jobs" className={`nav__link ${isActive('/jobs')}`}>Browse roles</Link>
            {user && (
              <>
                <Link to="/dashboard" className={`nav__link ${isActive('/dashboard')}`}>Overview</Link>
                <Link to="/analytics" className={`nav__link ${isActive('/analytics')}`}>Insights</Link>
                {user.role === 'employer' && (
                  <Link to="/create-job" className={`nav__link ${isActive('/create-job')}`}>Post a role</Link>
                )}
                {user.role === 'applicant' && (
                  <Link to="/my-applications" className={`nav__link ${isActive('/my-applications')}`}>My applications</Link>
                )}
              </>
            )}
          </div>

          <div className="nav__actions">
            {user ? (
              <>
                <span className="nav__user">
                  <span className="nav__user-dot" />
                  <span className="nav__user-name">{user.name}</span>
                  <span className="nav__user-role">{user.role}</span>
                </span>
                <button type="button" onClick={handleLogout} className="nav__logout">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button type="button" className="nav__login">
                    Log in
                  </button>
                </Link>
                <Link to="/register">
                  <button type="button" className="nav__primary">
                    Create account
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
