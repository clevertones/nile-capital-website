import React, { useMemo } from 'react';

const formatAmount = (value) => new Intl.NumberFormat('en-US').format(value);

function getDirection(transaction) {
  const type = String(transaction?.type || '').toLowerCase();
  if (type === 'in' || type === 'cash in') return 'in';
  if (type === 'out' || type === 'payout' || type === 'cash out') return 'out';
  return null;
}

function isCompleted(transaction) {
  const status = String(transaction?.status || '').toLowerCase();
  return status ? status === 'completed' : true;
}

export default function SummaryCards({ transactions = [] }) {
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let successCount = 0;

    transactions.forEach((transaction) => {
      if (!isCompleted(transaction)) {
        return;
      }

      successCount += 1;
      const amount = Number(transaction?.amount) || 0;
      const direction = getDirection(transaction);

      if (direction === 'in') {
        totalIn += amount;
      }

      if (direction === 'out') {
        totalOut += amount;
      }
    });

    const total = transactions.length;
    const successRate = total === 0 ? 0 : Math.round((successCount / total) * 100);
    const floatLevel = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      successRate,
      floatLevel,
    };
  }, [transactions]);

  const cards = [
    {
      label: 'Total In',
      value: `TZS ${formatAmount(summary.totalIn)}`,
      icon: '📥',
      color: '#1D9E75',
      bg: '#E1F5EE',
    },
    {
      label: 'Total Out',
      value: `TZS ${formatAmount(summary.totalOut)}`,
      icon: '📤',
      color: '#e74c3c',
      bg: '#fdecea',
    },
    {
      label: 'Success Rate',
      value: `${summary.successRate}%`,
      icon: '✅',
      color: '#EF9F27',
      bg: '#fff8e6',
    },
    {
      label: 'Float Level',
      value: `TZS ${formatAmount(summary.floatLevel)}`,
      icon: '💰',
      color: summary.floatLevel < 0 ? '#e74c3c' : '#04342C',
      bg: summary.floatLevel < 0 ? '#fdecea' : '#E1F5EE',
    },
  ];

  return (
    <section style={styles.grid} aria-label="Summary metrics">
      {cards.map((card) => (
        <article key={card.label} style={{ ...styles.card, borderTop: `3px solid ${card.color}` }}>
          <div style={{ ...styles.iconBox, background: card.bg }} aria-hidden="true">
            {card.icon}
          </div>
          <div style={styles.cardBody}>
            <p style={styles.cardLabel}>{card.label}</p>
            <p style={{ ...styles.cardValue, color: card.color }}>{card.value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    padding: '12px 20px',
  },
  card: {
    background: '#fff',
    borderRadius: 10,
    border: '0.5px solid #ddd',
    padding: '14px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 11,
    color: '#888',
    margin: '0 0 2px',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
};