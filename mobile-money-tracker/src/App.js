import React, { useEffect, useMemo, useState } from 'react';
import { HashRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import './App.css';
import { auth, db, firebaseReady } from './firebase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';
import SummaryCards from './components/SummaryCards';
import DateFilter from './components/DateFilter';
import TransactionList from './components/TransactionList';

const starterTransactions = [
  { id: 1, type: 'Cash in', network: 'M-Pesa', phone: '255 7XX XXX 501', amount: 420000, reference: 'INV-2026-018', note: 'Investor top-up', time: '8 min ago' },
  { id: 2, type: 'Payout', network: 'Tigo Pesa', phone: '255 7XX XXX 214', amount: 185000, reference: 'OPS-2026-044', note: 'Supplier settlement', time: '21 min ago' },
  { id: 3, type: 'Cash in', network: 'Airtel Money', phone: '255 7XX XXX 988', amount: 98000, reference: 'RET-2026-129', note: 'Retail collections', time: '1 hr ago' },
];

const formatAmount = (value) => new Intl.NumberFormat('en-US').format(value);

const defaultForm = { type: 'Cash in', network: 'M-Pesa', phone: '', amount: '', reference: '', note: '' };

function normalizeCreatedAt(createdAt) {
  if (!createdAt) return null;

  const firestoreDate = createdAt.toDate?.();
  if (firestoreDate instanceof Date) return firestoreDate;

  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOf(unit, now) {
  const date = new Date(now);

  if (unit === 'day') date.setHours(0, 0, 0, 0);
  if (unit === 'week') {
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
  }
  if (unit === 'month') {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }
  if (unit === 'year') {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function sortTransactions(items) {
  return [...items].sort((left, right) => {
    const leftTime = normalizeCreatedAt(left.createdAt)?.getTime?.() ?? 0;
    const rightTime = normalizeCreatedAt(right.createdAt)?.getTime?.() ?? 0;
    return rightTime - leftTime;
  });
}

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
            {firebaseReady ? 'Tracker online' : 'Tracker unavailable'}
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
            The workspace is built for day-to-day transaction handling.
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
          <div className="panel-head"><span className="panel-label">Workspace</span><span className="panel-badge">Operational view</span></div>
          <ul className="feature-list">
            <li><h3>Transaction feed</h3><p>Review mobile money inflows, payouts, and reference notes in one place.</p></li>
            <li><h3>Fast operator layout</h3><p>Move through the workflow quickly with a clean, focused interface.</p></li>
            <li><h3>Nile Capital brand</h3><p>The visual language stays aligned with the rest of the site.</p></li>
          </ul>
        </aside>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-head"><span className="panel-label">Operating model</span><span className="panel-badge">Focus first</span></div>
          <div className="step-list">
            <div className="step-item"><span>1</span><p>Track transactions from a single workspace.</p></div>
            <div className="step-item"><span>2</span><p>Filter activity by time period for faster review.</p></div>
            <div className="step-item"><span>3</span><p>Keep the ledger clear, current, and easy to scan.</p></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><span className="panel-label">Recent activity</span><span className="panel-badge">Live view</span></div>
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
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('today');
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser || !db) {
      setTransactions([]);
      setLoading(false);
      return undefined;
    }

    const q = query(collection(db, 'transactions'), where('uid', '==', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setTransactions(sortTransactions(data));
        setLoading(false);
      },
      () => {
        setTransactions([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  const visibleTransactions = useMemo(() => {
    const now = new Date();
    let cutoff = null;

    switch (filter) {
      case 'today':
        cutoff = getStartOf('day', now);
        break;
      case 'week':
        cutoff = getStartOf('week', now);
        break;
      case 'month':
        cutoff = getStartOf('month', now);
        break;
      case 'year':
        cutoff = getStartOf('year', now);
        break;
      default:
        cutoff = null;
    }

    if (!cutoff) return transactions;

    return transactions.filter((transaction) => {
      const createdAt = normalizeCreatedAt(transaction.createdAt);
      return createdAt ? createdAt >= cutoff : false;
    });
  }, [transactions, filter]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser || !db) return;

    const amount = Number.parseFloat(form.amount || '0');
    if (!amount || amount <= 0) return;

    setSaving(true);

    try {
      await addDoc(collection(db, 'transactions'), {
        uid: currentUser.uid,
        type: form.type,
        network: form.network,
        phone: form.phone || 'Unknown phone',
        amount,
        reference: form.reference || `MOMO-${Date.now().toString().slice(-5)}`,
        note: form.note || 'No note added',
        time: 'Just now',
        createdAt: serverTimestamp(),
      });

      setForm(defaultForm);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main>
      <section className="tracker-hero panel">
        <div>
          <span className="eyebrow">TRACKER PAGE</span>
          <h1>Manage mobile money flow with a clean Nile page.</h1>
          <p>Track transactions, review totals, and keep the ledger easy to read.</p>
          <div className="hero-actions">
            <button type="button" className="btn-secondary" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </section>

      <SummaryCards transactions={visibleTransactions} />
      <DateFilter active={filter} onChange={setFilter} />

      <section className="tracker-grid">
        <form className="panel tracker-form" onSubmit={handleSubmit}>
          <div className="panel-head"><span className="panel-label">New transaction</span><span className="panel-badge">Entry form</span></div>

          <div className="field-grid">
            <label><span>Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Cash in</option><option>Payout</option></select></label>
            <label><span>Network</span><select value={form.network} onChange={(event) => setForm({ ...form, network: event.target.value })}><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option><option>HaloPesa</option></select></label>
            <label><span>Phone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="255 7XX XXX XXX" /></label>
            <label><span>Amount</span><input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="TZS 0" type="number" min="0" step="1" /></label>
            <label><span>Reference</span><input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="INV-2026-001" /></label>
            <label className="span-2"><span>Note</span><input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Purpose, desk, or branch note" /></label>
          </div>

          <button type="submit" className="btn-primary btn-wide" disabled={saving}>{saving ? 'Saving…' : 'Add to tracker'}</button>
        </form>

        <aside className="panel tracker-side">
          <div className="panel-head"><span className="panel-label">Workspace</span><span className="panel-badge">Fast view</span></div>
          <div className="info-card"><h3>Focus on the ledger</h3><p>Keep the page centered on transactions, totals, and quick filtering.</p></div>
          <div className="info-card filter-card"><h3>Quick view</h3><p>Use the date filter above to switch between today, week, month, year, or all records.</p></div>
        </aside>
      </section>

      <section className="panel ledger-panel">
        <div className="panel-head"><span className="panel-label">Ledger</span><span className="panel-badge">{visibleTransactions.length} records</span></div>
        {loading ? (
          <p style={{ padding: '0 4px 8px', color: '#58716a' }}>Loading transactions…</p>
        ) : (
          <TransactionList transactions={visibleTransactions} />
        )}
      </section>
    </main>
  );
}

export default App;
