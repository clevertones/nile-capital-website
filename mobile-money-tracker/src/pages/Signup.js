import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NETWORKS = [
  { id: 'mpesa', label: 'M-Pesa', color: '#00A650' },
  { id: 'airtel', label: 'Airtel Money', color: '#E40000' },
  { id: 'mix', label: 'Mix by Yass', color: '#F7941D' },
  { id: 'tigo', label: 'Tigo Pesa', color: '#0093D0' },
];

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for that email.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Sign up failed. Please try again.';
  }
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('mpesa');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({ fullName, email, password, phone, network });
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  function handleContinue(event) {
    event.preventDefault();
    setError('');

    if (!event.currentTarget.reportValidity()) {
      return;
    }

    setStep(2);
  }

  function goBack() {
    setStep(1);
  }

  const selectedNetworkLabel = NETWORKS.find((item) => item.id === network)?.label || 'M-Pesa';

  return (
    <main className="auth-shell">
      <section className="auth-card panel">
        <div className="panel-head auth-head">
          <span className="panel-label">MoMo Tracker</span>
          <span className="panel-badge">Trial</span>
        </div>

        {step === 1 && (
          <>
            <h1>Start your free trial</h1>
            <p className="auth-copy">
              Create an agent account for your Nile Capital MoMo Tracker workspace.
            </p>

            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <form onSubmit={handleContinue} className="auth-form">
              <label>
                <span>Full name</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label>
                <span>Phone</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              <div className="network-step">
                <span className="network-step-label">Select your network</span>
                <div className="network-grid" role="radiogroup" aria-label="Select mobile money network">
                  {NETWORKS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`network-chip ${network === item.id ? 'selected' : ''}`}
                      style={{ '--network-accent': item.color }}
                      onClick={() => setNetwork(item.id)}
                      aria-pressed={network === item.id}
                    >
                      <span className="network-dot" aria-hidden="true" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary btn-wide">
                Continue →
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Confirm your trial</h1>
            <p className="auth-copy">
              You’re about to create a trial account for <strong>{fullName || 'your team'}</strong> using <strong>{selectedNetworkLabel}</strong>.
            </p>

            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <div className="trial-summary">
              <div className="trial-summary-row">
                <span>Name</span>
                <strong>{fullName || '—'}</strong>
              </div>
              <div className="trial-summary-row">
                <span>Email</span>
                <strong>{email || '—'}</strong>
              </div>
              <div className="trial-summary-row">
                <span>Phone</span>
                <strong>{phone || '—'}</strong>
              </div>
              <div className="trial-summary-row">
                <span>Network</span>
                <strong>{selectedNetworkLabel}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <button type="submit" className="btn-primary btn-wide" disabled={loading}>
                {loading ? 'Creating account…' : 'Start Free Trial'}
              </button>
              <button type="button" className="btn-secondary btn-wide" onClick={goBack} disabled={loading}>
                Back
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
