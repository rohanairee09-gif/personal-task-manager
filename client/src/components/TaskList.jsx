// TaskList.jsx — Renders the filtered list of tasks (or empty states)
//
// Drag-and-drop strategy (native HTML5, no library):
//   • Each <li> is draggable. On dragstart it stores the dragged task's id.
//   • On dragover it calls onReorder(draggedId, targetId) to preview the new order.
//   • The actual order state lives in App.jsx — this component just fires events.
//   • A `dragOver` local state tracks which item is the current drop target
//     so we can show a visual highlight.

import { useState, useRef } from 'react';
import TaskItem from './TaskItem';
import styles from './TaskList.module.css';

export default function TaskList({ tasks, filter, search, onToggle, onEdit, onDelete, onReorder }) {
  // id of the item currently being dragged over (for drop-target highlight)
  const [dragOverId, setDragOverId] = useState(null);
  // ref to hold the id of the item being dragged (avoids stale closure issues)
  const draggedId = useRef(null);

  // ── Empty state handling ─────────────────────────────────────────────────
  if (tasks.length === 0) {
    // When a search is active show a specific "no results" message
    if (search && search.trim()) {
      return (
        <div className={styles.emptyState} role="status" aria-live="polite">
          <span className={styles.emptyEmoji} aria-hidden="true">🔎</span>
          <p className={styles.emptyHeading}>No tasks match "{search}"</p>
          <p className={styles.emptySub}>Try a different search term.</p>
        </div>
      );
    }

    // Tailor the empty-state message to the current filter
    const messages = {
      all:       { emoji: '📋', heading: 'No tasks yet',          sub: 'Add your first task above to get started.' },
      active:    { emoji: '🎉', heading: 'All caught up!',         sub: 'No active tasks remaining.' },
      completed: { emoji: '📭', heading: 'Nothing completed yet',  sub: 'Finish a task and it will appear here.' },
    };
    const { emoji, heading, sub } = messages[filter] || messages.all;

    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <span className={styles.emptyEmoji} aria-hidden="true">{emoji}</span>
        <p className={styles.emptyHeading}>{heading}</p>
        <p className={styles.emptySub}>{sub}</p>
      </div>
    );
  }

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (id) => {
    draggedId.current = id;
  };

  const handleDragOver = (e, id) => {
    e.preventDefault(); // required to allow dropping
    if (draggedId.current !== id) {
      setDragOverId(id);
      onReorder(draggedId.current, id);
    }
  };

  const handleDragEnd = () => {
    draggedId.current = null;
    setDragOverId(null);
  };

  return (
    <ul className={styles.list} aria-label="Task list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isDragOver={dragOverId === task.id}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}
    </ul>
  );
}
