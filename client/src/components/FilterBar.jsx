// FilterBar.jsx — Filter tabs (All / Active / Completed) + task counts
//
// This is a pure presentational component: it receives the current filter,
// the counts, and a setter callback — it owns no state of its own.

import styles from './FilterBar.module.css';

const FILTERS = ['all', 'active', 'completed'];

export default function FilterBar({ filter, setFilter, activeCount, completedCount }) {
  return (
    <div className={styles.bar}>
      {/* ── Running counts ── */}
      <div className={styles.counts} aria-live="polite">
        <span className={styles.countPill}>
          <span className={styles.countNum}>{activeCount}</span> active
        </span>
        <span className={`${styles.countPill} ${styles.done}`}>
          <span className={styles.countNum}>{completedCount}</span> done
        </span>
      </div>

      {/* ── Filter buttons ── */}
      <nav className={styles.filters} aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {/* Capitalise first letter */}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}
