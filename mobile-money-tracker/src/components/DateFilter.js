import React from 'react';

// MoMo Tracker — Phase 2
// Tab-style filter: Today | This Week | This Month | This Year | All Time
const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

/**
 * Props:
 *   active   - currently selected filter key (string)
 *   onChange - callback(key: string) when user taps a tab
 */
export default function DateFilter({ active, onChange }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.track} role="tablist" aria-label="Transaction date filter">
        {FILTERS.map((filter) => {
          const isActive = filter.key === active;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChange(filter.key)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : styles.tabInactive),
              }}
              aria-pressed={isActive}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '0 20px 12px',
    overflowX: 'auto',
  },
  track: {
    display: 'flex',
    gap: 8,
    flexWrap: 'nowrap',
    minWidth: 'max-content',
  },
  tab: {
    border: 'none',
    borderRadius: 20,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, color 0.15s',
    outline: 'none',
  },
  tabActive: {
    background: '#04342C',
    color: '#E1F5EE',
  },
  tabInactive: {
    background: '#E1F5EE',
    color: '#04342C',
  },
};