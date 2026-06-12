import React, { useMemo, useState } from 'react';
import { HashRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { firebaseReady } from './firebase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

const starterTransactions = [
  { id: 1, type: 'Cash in', network: 'M-Pesa', phone: '255 7XX XXX 501', amount: 420000, reference: 'INV-2026-018', note: 'Investor top-up', time: '8 min ago' },
  { id: 2, type: 'Payout', network: 'Tigo Pesa', phone: '255 7XX XXX 214', amount: 185000, reference: 'OPS-2026-044', note: 'Supplier settlement', time: '21 min ago' },
  { id: 3, type: 'Cash in', network: 'Airtel Money', phone: '255 7XX XXX 988', amount: 98000, reference: 'RET-2026-129', note: 'Retail collections', time: '1 hr ago' },
];

const featureCards = [
  { title: 'Live transaction feed', copy: 'Track cash in, cash out, and reference notes from one page designed for fast operator workflows.' },
  { title: 'Firebase-ready', copy: 'The app is wired with a Firebase helper so Firestore can be connected once the config keys are added.' },
  { title: 'Built for Nile Capital', copy: 'The visual language follows the site: deep green, gold accents, and a clean investor-grade layout.' },
];

const setupSteps = [
  'Set your Firebase env vars in `mobile-money-tracker/.env`.',
  'Connect Firestore collections for transactions and monthly summaries.',
  'Swap the local demo list for live data once the backend is ready.',
];

const networkOptions = ['All networks', 'M-Pesa', 'Tigo Pesa', 'Airtel Money', 'HaloPesa'];

const formatAmount = (value) => new Intl.NumberFormat('en-US').format(value);

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <HashRouter>
      <div className="momo-app">
        <header className="site-header">
          <Link to="/" className="brand-mark">
            <span className="brand-kicker">NiLe Capital</span>
            <span className="brand-name">MoMo Tracker</span>
          </Link>

          <nav className="site-nav" aria-label="MoMo Tracker navigation">
            <NavLink to="/" end className={({ isActive }) => `site-link ${isActive ? 'active' : ''}`}>Overview</NavLink>
            <NavLink to="/tracker" className={({ isActive }) => `site-link ${isActive ? 'active' : ''}`}>Tracker</NavLink>
            <NavLink to="/login" className={({ isActive }) => `site-link ${isActive ? 'active' : ''}`}>Login</NavLink>
          </nav>

          <div className="status-chip">
            <span className={firebaseReady ? 'status-dot ready' : 'status-dot'} />
            {firebaseReady ? 'Firebase ready' : 'Firebase setup pending'}
          </div>
        </header>

        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route
            path="/tracker"
            element={(
              <ProtectedRoute>
                <TrackerPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

function OverviewPage() {
  const totals = useMemo(() => {
    const volume = starterTransactions.reduce((sum, item) => sum + item.amount, 0);
    return { volume, cashIn: 2, cashOut: 1 };
  }, []);

  return (
    <main>
      <section className="hero-grid">
        <div className="hero-copy panel">
          <span className="eyebrow">MOBILE MONEY OPERATIONS</span>
          <h1>MoMo Tracker</h1>
          <p className="hero-text">
            A Nile Capital page for tracking mobile money inflows, payouts, and operational notes in one place.
            This starter is ready to grow into a Firebase-backed workflow.
          </p>

          <div className="hero-actions">
            <Link to="/tracker" className="btn-primary">Open Tracker</Link>
            <a href="#/tracker" className="btn-secondary">View transaction page</a>
          </div>

          <div className="mini-metrics">
            <article><span>Monthly volume</span><strong>TZS {formatAmount(totals.volume)}</strong></article>
            <article><span>Cash in</span><strong>{totals.cashIn}</strong></article>
            <article><span>Payouts</span><strong>{totals.cashOut}</strong></article>
          </div>
        </div>

        <aside className="hero-panel panel">
          <div className="panel-head"><span className="panel-label">Starter stack</span><span className="panel-badge">React + Firebase</span></div>
          <ul className="feature-list">
            {featureCards.map((feature) => (
              <li key={feature.title}><h3>{feature.title}</h3><p>{feature.copy}</p></li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-head"><span className="panel-label">How it starts</span><span className="panel-badge">Page first</span></div>
          <div className="step-list">
            {setupSteps.map((step, index) => (
              <div className="step-item" key={step}><span>{index + 1}</span><p>{step}</p></div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><span className="panel-label">Recent activity</span><span className="panel-badge">Demo data</span></div>
          <div className="activity-list">
            {starterTransactions.map((item) => (
              <article className="activity-item" key={item.id}>
                <div><h3>{item.reference}</h3><p>{item.type} · {item.network} · {item.note}</p></div>
                <strong>TZS {formatAmount(item.amount)}</strong>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function TrackerPage() {
  const [transactions, setTransactions] = useState(starterTransactions);
  const [filter, setFilter] = useState('All networks');
  const [form, setForm] = useState({ type: 'Cash in', network: 'M-Pesa', phone: '', amount: '', reference: '', note: '' });

  const visibleTransactions = useMemo(() => (filter === 'All networks' ? transactions : transactions.filter((item) => item.network === filter)), [transactions, filter]);

  const metrics = useMemo(() => {
    const total = transactions.reduce((sum, item) => sum + item.amount, 0);
    const cashIn = transactions.filter((item) => item.type === 'Cash in').reduce((sum, item) => sum + item.amount, 0);
    const cashOut = transactions.filter((item) => item.type === 'Payout').reduce((sum, item) => sum + item.amount, 0);
    return { total, cashIn, cashOut, liveCount: transactions.length };
  }, [transactions]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(form.amount || '0');
    if (!amount || amount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      type: form.type,
      network: form.network,
      phone: form.phone || 'Unknown phone',
      amount,
      reference: form.reference || `MOMO-${Date.now().toString().slice(-5)}`,
      note: form.note || 'No note added',
      time: 'Just now',
    };

    setTransactions((current) => [newTransaction, ...current]);
    setForm({ type: 'Cash in', network: 'M-Pesa', phone: '', amount: '', reference: '', note: '' });
  };

  return (
    <main>
      <section className="tracker-hero panel">
        <div>
          <span className="eyebrow">TRACKER PAGE</span>
          <h1>Manage mobile money flow with a clean Nile page.</h1>
          <p>This starter keeps the data model simple now and leaves room for Firestore collections, authenticated roles, and reporting later.</p>
        </div>

        <div className="tracker-stats">
          <article><span>Total volume</span><strong>TZS {formatAmount(metrics.total)}</strong></article>
          <article><span>Cash in</span><strong>TZS {formatAmount(metrics.cashIn)}</strong></article>
          <article><span>Payouts</span><strong>TZS {formatAmount(metrics.cashOut)}</strong></article>
          <article><span>Live entries</span><strong>{metrics.liveCount}</strong></article>
        </div>
      </section>

      <section className="tracker-grid">
        <form className="panel tracker-form" onSubmit={handleSubmit}>
          <div className="panel-head"><span className="panel-label">New transaction</span><span className="panel-badge">Local demo</span></div>

          <div className="field-grid">
            <label><span>Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Cash in</option><option>Payout</option></select></label>
            <label><span>Network</span><select value={form.network} onChange={(event) => setForm({ ...form, network: event.target.value })}><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option><option>HaloPesa</option></select></label>
            <label><span>Phone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="255 7XX XXX XXX" /></label>
            <label><span>Amount</span><input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="TZS 0" type="number" min="0" step="1" /></label>
            <label><span>Reference</span><input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="INV-2026-001" /></label>
            <label className="span-2"><span>Note</span><input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Purpose, desk, or branch note" /></label>
          </div>

          <button type="submit" className="btn-primary btn-wide">Add to tracker</button>
        </form>

        <aside className="panel tracker-side">
          <div className="panel-head"><span className="panel-label">Firebase roadmap</span><span className="panel-badge">Next step</span></div>
          <div className="info-card"><h3>Ready for Firestore</h3><p>Once your Firebase project keys are added, this page can save transactions to Firestore and sync them across devices.</p></div>
          <div className="info-card filter-card"><h3>Network filter</h3><div className="chip-row">{networkOptions.map((option) => (<button key={option} type="button" className={`filter-chip ${filter === option ? 'active' : ''}`} onClick={() => setFilter(option)}>{option}</button>))}</div></div>
        </aside>
      </section>

      <section className="panel ledger-panel">
        <div className="panel-head"><span className="panel-label">Ledger</span><span className="panel-badge">{visibleTransactions.length} records</span></div>
        <div className="ledger-list">
          {visibleTransactions.map((item) => (
            <article className="ledger-row" key={item.id}>
              <div><h3>{item.reference}</h3><p>{item.type} · {item.network} · {item.phone}</p><span>{item.note}</span></div>
              <div className="ledger-amount"><strong>{item.type === 'Cash in' ? '+' : '-'}</strong><strong>TZS {formatAmount(item.amount)}</strong><span>{item.time}</span></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
