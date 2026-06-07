// App.jsx — Root component
//
// State management overview:
//   • `useTasks` (custom hook) owns all task data and server-sync logic.
//     It exposes: tasks[], loading, error, addTask, toggleTask, editTask, removeTask.
//   • `filter`  — UI-only filter tab state ('all' | 'active' | 'completed')
//   • `search`  — UI-only search query string
//   • `taskOrder` — UI-only array of task ids that tracks the current drag-and-drop order.
//     It is initialised from the server order and updated locally on every drop.
//     We keep it separate from `tasks` so server data stays clean.
//   • `filteredTasks` — derived via useMemo from tasks + filter + search + taskOrder

import { useState, useMemo, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import ProgressBar from './components/ProgressBar';
import styles from './App.module.css';

export default function App() {
  // ── Task state (from custom hook) ────────────────────────────────────────
  const { tasks, loading, error, addTask, toggleTask, editTask, removeTask } = useTasks();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [filter, setFilter]   = useState('all');   // 'all' | 'active' | 'completed'
  const [search, setSearch]   = useState('');       // search query

  // taskOrder stores the *display* order as an array of task ids.
  // Initialised from the server order; updated when the user drags a row.
  const [taskOrder, setTaskOrder] = useState([]);

  // Keep taskOrder in sync when tasks arrive or new tasks are added.
  // We only ADD ids that are not already present so we don't reset a
  // custom order the user set by dragging.
  useEffect(() => {
    setTaskOrder((prev) => {
      const existingIds = new Set(prev);
      const newIds      = tasks.map((t) => t.id).filter((id) => !existingIds.has(id));
      // Remove ids that no longer exist (deleted tasks), then prepend new ones
      const stillValid  = prev.filter((id) => tasks.some((t) => t.id === id));
      return [...newIds, ...stillValid];
    });
  }, [tasks]);

  // ── Drag-and-drop handler (lifted up from TaskList) ───────────────────────
  // Called by TaskList with (draggedId, targetId) after a successful drop.
  // Reorders the taskOrder array by moving draggedId to the position of targetId.
  const handleReorder = (draggedId, targetId) => {
    if (draggedId === targetId) return;
    setTaskOrder((prev) => {
      const next      = [...prev];
      const fromIndex = next.indexOf(draggedId);
      const toIndex   = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedId);
      return next;
    });
  };

  // ── Derived: filtered + searched + ordered task list ─────────────────────
  const filteredTasks = useMemo(() => {
    // 1. Apply status filter
    let result = tasks;
    if (filter === 'active')    result = tasks.filter((t) => !t.isComplete);
    if (filter === 'completed') result = tasks.filter((t) =>  t.isComplete);

    // 2. Apply search (case-insensitive substring match on title)
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((t) => t.title.toLowerCase().includes(q));

    // 3. Apply drag-and-drop order — sort by position in taskOrder array
    return [...result].sort((a, b) => {
      const ai = taskOrder.indexOf(a.id);
      const bi = taskOrder.indexOf(b.id);
      // Items not yet in taskOrder go to the end
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [tasks, filter, search, taskOrder]);

  // ── Derived: counts ───────────────────────────────────────────────────────
  const activeCount    = tasks.filter((t) => !t.isComplete).length;
  const completedCount = tasks.filter((t) =>  t.isComplete).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.headerIcon} aria-hidden="true">✅</span>
          <h1 className={styles.appTitle}>Personal Task Manager</h1>
          <span className={styles.appSubtitle}>Stay organised</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Task creation form */}
        <TaskForm onAdd={addTask} />

        {/* Progress bar */}
        {!loading && !error && tasks.length > 0 && (
          <ProgressBar total={tasks.length} completed={completedCount} />
        )}

        {/* Search bar */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search tasks by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs + counts */}
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          activeCount={activeCount}
          completedCount={completedCount}
        />

        {/* Loading / error / task list */}
        {loading ? (
          <div className={styles.loading} role="status">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            Loading tasks…
          </div>
        ) : error ? (
          <p className={styles.globalError} role="alert">
            ⚠ Could not connect to the server: {error}
          </p>
        ) : (
          <TaskList
            tasks={filteredTasks}
            filter={filter}
            search={search}
            onToggle={toggleTask}
            onEdit={editTask}
            onDelete={removeTask}
            onReorder={handleReorder}
          />
        )}
      </main>
    </div>
  );
}
