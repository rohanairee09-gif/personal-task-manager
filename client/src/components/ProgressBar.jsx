// ProgressBar.jsx — Shows overall task completion as a percentage bar

import styles from './ProgressBar.module.css';

export default function ProgressBar({ total, completed }) {
  // Avoid division by zero when there are no tasks
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Pick a colour based on progress
  const getColor = () => {
    if (percent === 100) return styles.complete;
    if (percent >= 50)  return styles.halfway;
    return styles.started;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Overall Progress</span>
        <span className={styles.percent}>{percent}%</span>
      </div>

      <div className={styles.track} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${styles.fill} ${getColor()}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className={styles.sub}>
        {completed} of {total} task{total !== 1 ? 's' : ''} completed
      </p>
    </div>
  );
}
