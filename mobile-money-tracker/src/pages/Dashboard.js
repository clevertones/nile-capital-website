import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NETWORK_LABELS = {
  mpesa: 'M-Pesa',
  airtel: 'Airtel Money',
  mix: 'Mix by Yass',
  tigo: 'Tigo Pesa',
};

export default function Dashboard() {
  const { currentUser, agentProfile, logout, getTrialDaysLeft, isPaidPlan } = useAuth();
  const networkLabel = NETWORK_LABELS[agentProfile?.network] || agentProfile?.network || 'M-Pesa';

  return (
    <main className="auth-shell">
      <section className="auth-card panel">
        <div className="panel-head auth-head">
          <span className="panel-label">Dashboard</span>
          <span className="panel-badge">Agent access</span>
        </div>

        <h1>Welcome to MoMo Tracker</h1>
        <p className="auth-copy">
          {currentUser?.email || 'Signed in user'} {agentProfile?.fullName ? `· ${agentProfile.fullName}` : ''}
        </p>

        <div className="dashboard-stats">
          <article>
            <span>Plan</span>
            <strong>{isPaidPlan() ? agentProfile?.plan : 'Trial'}</strong>
          </article>
          <article>
            <span>Trial days left</span>
            <strong>{getTrialDaysLeft()}</strong>
          </article>
          <article>
            <span>Network</span>
            <strong>{networkLabel}</strong>
          </article>
        </div>

        <div className="hero-actions">
          <Link to="/tracker" className="btn-primary">Open tracker</Link>
          <button type="button" className="btn-secondary" onClick={logout}>Sign out</button>
        </div>
      </section>
    </main>
  );
}
