import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="landing">
      <section className="landing__hero">
        <div className="landing__hero-shell">
          <div className="landing__pill">
            <span className="landing__pill-dot" />
            Built for small teams hiring in the real world
          </div>

          <h1 className="landing__title">
            A calmer way to follow every job and application.
          </h1>

          <p className="landing__subtitle">
            HireFlow keeps openings, candidates, scores, and conversations in one simple
            place. No more lost CVs, messy spreadsheets, or guessing where things stand.
          </p>

          <div className="landing__cta-row">
            <Link to="/register?role=employer">
              <button type="button" className="btn-primary landing__cta-main">
                Start a hiring workspace
              </button>
            </Link>
            <Link to="/register?role=applicant">
              <button type="button" className="btn-secondary landing__cta-secondary">
                I&apos;m looking for a role
              </button>
            </Link>
          </div>

          <p className="landing__footnote">
            No demo calls. No long setup. Just sign up, post a role, and share one link.
          </p>
        </div>

        <div className="landing__panel">
          <div className="landing__panel-row">
            <div className="landing__panel-header">
              <span className="landing__badge">Active role</span>
              <span className="landing__panel-title">Senior Product Designer</span>
              <span className="landing__panel-meta">12 candidates · Updated a few minutes ago</span>
            </div>
            <div className="landing__panel-metric">
              <span className="landing__metric-label">Time to shortlist</span>
              <span className="landing__metric-value">6 min</span>
            </div>
          </div>

          <ul className="landing__candidate-list">
            {sampleCandidates.map((candidate) => (
              <li key={candidate.name} className="landing__candidate-row">
                <div className="landing__candidate-main">
                  <div className="landing__avatar">{candidate.initials}</div>
                  <div>
                    <div className="landing__candidate-name">{candidate.name}</div>
                    <div className="landing__candidate-note">{candidate.note}</div>
                  </div>
                </div>
                <div className="landing__candidate-score">
                  <span className="landing__score-label">{candidate.score}/100</span>
                  <div className="score-bar">
                    <div
                      className={`score-fill ${candidate.scoreClass}`}
                      style={{ width: `${candidate.score}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing__section">
        <div className="page-shell">
          <div className="landing__section-header">
            <div>
              <h2 className="landing__section-title">Designed for hiring managers and candidates</h2>
              <p className="landing__section-subtitle">
                Whether you’re filling your first role or tracking dozens of applications, HireFlow
                keeps both sides of the process tidy and honest.
              </p>
            </div>
          </div>

          <div className="landing__grid">
            {featureCards.map((card) => (
              <article key={card.title} className="landing__feature-card card card--subtle">
                <div className="landing__feature-icon">{card.icon}</div>
                <h3 className="landing__feature-title">{card.title}</h3>
                <p className="landing__feature-copy">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing__section landing__section--bordered">
        <div className="page-shell landing__bottom">
          <div className="landing__bottom-copy">
            <h2 className="landing__section-title">See where every role and application stands.</h2>
            <p className="landing__section-subtitle">
              One simple board for open roles, one clear list for your applications. No status lives
              in someone&apos;s head or buried in an email thread.
            </p>
          </div>
          <div className="landing__bottom-actions">
            <Link to="/register?role=employer">
              <button type="button" className="btn-primary">
                Try it on your next hire
              </button>
            </Link>
            <Link to="/jobs">
              <button type="button" className="btn-secondary">
                Browse live roles
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const sampleCandidates = [
  {
    name: 'Aisha Verma',
    initials: 'AV',
    note: 'Strong case studies, clear story around impact.',
    score: 92,
    scoreClass: 'score-fill--high',
  },
  {
    name: 'Daniel Kim',
    initials: 'DK',
    note: 'Solid experience, needs clarity on outcomes.',
    score: 78,
    scoreClass: 'score-fill--mid',
  },
  {
    name: 'Priya Patel',
    initials: 'PP',
    note: 'Early in career but thoughtful writing and projects.',
    score: 68,
    scoreClass: 'score-fill--mid',
  },
];

const featureCards = [
  {
    icon: '📋',
    title: 'Simple, honest status',
    body: 'Everyone sees the same clear stages — applied, shortlisted, interviewed, hired — without guessing or chasing updates.',
  },
  {
    icon: '🧠',
    title: 'Helpful scoring, not black boxes',
    body: 'Scores highlight patterns in a CV and job description so you can skim faster. You still make the final call.',
  },
  {
    icon: '🔎',
    title: 'Searchable history',
    body: 'Filter by role, location, or status to quickly find candidates you spoke to months ago when a new opening appears.',
  },
  {
    icon: '✉️',
    title: 'Better candidate experience',
    body: 'Applicants can track their own applications instead of wondering if their CV disappeared into a folder somewhere.',
  },
];
