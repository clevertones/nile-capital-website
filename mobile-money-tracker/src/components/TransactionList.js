import React from 'react';

const STATUS_STYLE = {
  completed: { bg: '#E1F5EE', color: '#1D9E75', label: 'Completed' },
  pending: { bg: '#fff8e6', color: '#EF9F27', label: 'Pending' },
  failed: { bg: '#fdecea', color: '#e74c3c', label: 'Failed' },
};

const NETWORK_LABEL = {
  mpesa: 'M-Pesa',
  airtel: 'Airtel Money',
  mix: 'Mix by Yass',
  tigopesa: 'Tigo Pesa',
};

const formatTZS = (amount) => {
  const value = Number(amount) || 0;
  return `TZS ${value.toLocaleString('en-TZ')}`;
};

function getDirection(transaction) {
  const type = String(transaction?.type || '').toLowerCase();
  if (type === 'in' || type === 'cash in') return 'in';
  if (type === 'out' || type === 'payout' || type === 'cash out') return 'out';
  return 'out';
}

function getStatus(transaction) {
  const status = String(transaction?.status || '').toLowerCase();
  return STATUS_STYLE[status] ? status : 'pending';
}

function getNetworkLabel(transaction) {
  const network = String(transaction?.network || '').toLowerCase();
  return NETWORK_LABEL[network] ?? transaction?.network ?? 'Unknown network';
}

function formatDate(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-TZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionList({ transactions }) {
  if (!transactions.length) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyIcon}>📭</p>
        <p style={styles.emptyTitle}>No transactions yet</p>
        <p style={styles.emptyHint}>
          Tap <strong>+ Add Transaction</strong> to log your first entry.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.sectionLabel}>
        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </p>
      <div style={styles.list}>
        {transactions.map((transaction) => {
          const status = STATUS_STYLE[getStatus(transaction)];
          const isIn = getDirection(transaction) === 'in';
          const createdAt = transaction.createdAt?.toDate?.() ?? new Date(transaction.createdAt);

          return (
            <div key={transaction.id} style={styles.card}>
              <div
                style={{
                  ...styles.dirIcon,
                  background: isIn ? '#E1F5EE' : '#fdecea',
                  color: isIn ? '#1D9E75' : '#e74c3c',
                }}
                aria-hidden="true"
              >
                {isIn ? '↓' : '↑'}
              </div>

              <div style={styles.details}>
                <div style={styles.topRow}>
                  <span style={styles.network}>{getNetworkLabel(transaction)}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: status.bg,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                {transaction.reference ? <p style={styles.reference}>Ref: {transaction.reference}</p> : null}
                {transaction.note ? <p style={styles.note}>{transaction.note}</p> : null}
                <p style={styles.timestamp}>{formatDate(createdAt)}</p>
              </div>

              <div style={styles.amountCol}>
                <p
                  style={{
                    ...styles.amount,
                    color: isIn ? '#1D9E75' : '#e74c3c',
                  }}
                >
                  {isIn ? '+' : '-'} {formatTZS(transaction.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '0 20px',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: '#fff',
    borderRadius: 10,
    border: '0.5px solid #ddd',
    padding: '12px 14px',
  },
  dirIcon: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 0,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  network: {
    fontSize: 13,
    fontWeight: '600',
    color: '#04342C',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 20,
    padding: '2px 8px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reference: {
    fontSize: 11,
    color: '#0F6E56',
    fontFamily: "'Courier New', monospace",
    margin: '2px 0',
  },
  note: {
    fontSize: 12,
    color: '#555',
    margin: '2px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timestamp: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 3,
  },
  amountCol: {
    flexShrink: 0,
    textAlign: 'right',
  },
  amount: {
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    fontWeight: '700',
    margin: 0,
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#04342C',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: '#888',
    lineHeight: 1.6,
  },
  legacy: {
    display: 'none',
  },
  row: {
    background: '#fff',
    border: '1px solid rgba(15, 110, 86, 0.08)',
    boxShadow: '0 10px 24px rgba(12, 43, 35, 0.05)',
  },
};