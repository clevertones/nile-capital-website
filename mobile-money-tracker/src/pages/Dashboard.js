import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import SummaryCards from '../components/SummaryCards';
import DateFilter from '../components/DateFilter';
import TransactionList from '../components/TransactionList';

const DEFAULT_FILTER = 'today';

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

function normalizeCreatedAt(createdAt) {
  if (!createdAt) return null;

  const fromFirestore = createdAt.toDate?.();
  if (fromFirestore instanceof Date) return fromFirestore;

  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState(DEFAULT_FILTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !db) {
      setTransactions([]);
      setFiltered([]);
      setLoading(false);
      return undefined;
    }

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setTransactions(data);
        setLoading(false);
      },
      () => {
        setTransactions([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const now = new Date();
    let cutoff = null;

    switch (activeFilter) {
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

    if (!cutoff) {
      setFiltered(transactions);
      return;
    }

    setFiltered(
      transactions.filter((transaction) => {
        const createdAt = normalizeCreatedAt(transaction.createdAt);
        return createdAt ? createdAt >= cutoff : false;
      }),
    );
  }, [transactions, activeFilter]);

  const displayName = useMemo(() => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Agent', [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>MoMo Tracker</span>
          <span style={styles.logoSub}>by NiLe Capital</span>
        </div>
        <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div style={styles.greeting}>
        <p style={styles.greetText}>
          Welcome back, <strong>{displayName}</strong>
        </p>
        <p style={styles.greetSub}>Here&apos;s your agent activity</p>
      </div>

      <SummaryCards transactions={filtered} />
      <DateFilter active={activeFilter} onChange={setActiveFilter} />

      {loading ? (
        <p style={styles.loadingText}>Loading transactions…</p>
      ) : (
        <TransactionList transactions={filtered} />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4faf8',
    fontFamily: 'Arial, sans-serif',
    paddingBottom: 40,
  },
  header: {
    background: '#04342C',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    color: '#E1F5EE',
    fontWeight: 'bold',
  },
  logoSub: {
    fontSize: 10,
    color: '#5DCAA5',
    letterSpacing: 1,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #5DCAA5',
    color: '#5DCAA5',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  greeting: {
    padding: '18px 20px 6px',
  },
  greetText: {
    fontSize: 15,
    color: '#04342C',
  },
  greetSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    padding: 30,
  },
};
