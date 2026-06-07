// TaskItem.jsx — Displays a single task row with toggle, edit, and delete actions
//
// Local state pattern:
//   • `isEditing`  — boolean flag that swaps the read view for an inline edit form
//   • `editFields` — controlled state for the three editable fields while editing
//
// Drag-and-drop:
//   • The <li> has draggable=true and fires onDragStart / onDragOver / onDragEnd
//     callbacks up to TaskList, which owns the drag coordination logic.
//   • A drag handle (⠿) gives users a clear affordance for grabbing a row.
//   • isDragOver prop adds a highlight border when this item is the drop target.

import { useState } from 'react';
import styles from './TaskItem.module.css';

// Utility: returns true when a task is overdue
function isOverdue(task) {
  if (!task.dueDate || task.isComplete) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

// Utility: format a YYYY-MM-DD string to a readable locale date
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function TaskItem({
  task,
  isDragOver,
  onToggle, onEdit, onDelete,
  onDragStart, onDragOver, onDragEnd,
}) {
  // ── Edit mode state ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
  });
  const [editError, setEditError] = useState('');
  const [saving, setSaving]       = useState(false);

  const handleEditChange = (field) => (e) => {
    setEditFields((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setEditError('');
    if (!editFields.title.trim()) {
      setEditError('Title cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await onEdit(task.id, {
        title:       editFields.title.trim(),
        description: editFields.description.trim() || null,
        dueDate:     editFields.dueDate || null,
      });
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditFields({
      title:       task.title,
      description: task.description || '',
      dueDate:     task.dueDate || '',
    });
    setEditError('');
    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
    if (confirmed) onDelete(task.id);
  };

  // ── Derived display classes ───────────────────────────────────────────────
  const overdue = isOverdue(task);
  const itemClass = [
    styles.item,
    task.isComplete ? styles.complete  : '',
    overdue         ? styles.overdue   : '',
    isDragOver      ? styles.dropTarget : '',
  ].filter(Boolean).join(' ');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <li
      className={itemClass}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDragEnd={onDragEnd}
    >
      {isEditing ? (
        /* ── Edit mode ───────────────────────────────────────────────── */
        <div className={styles.editForm}>
          {editError && (
            <p className={styles.editError} role="alert">{editError}</p>
          )}

          <div className={styles.editField}>
            <label htmlFor={`edit-title-${task.id}`}>Title</label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editFields.title}
              onChange={handleEditChange('title')}
              autoFocus
            />
          </div>

          <div className={styles.editField}>
            <label htmlFor={`edit-desc-${task.id}`}>Description</label>
            <textarea
              id={`edit-desc-${task.id}`}
              value={editFields.description}
              onChange={handleEditChange('description')}
              rows={2}
            />
          </div>

          <div className={styles.editField}>
            <label htmlFor={`edit-due-${task.id}`}>Due Date</label>
            <input
              id={`edit-due-${task.id}`}
              type="date"
              value={editFields.dueDate}
              onChange={handleEditChange('dueDate')}
            />
          </div>

          <div className={styles.editActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Read mode ───────────────────────────────────────────────── */
        <div className={styles.readView}>

          {/* Drag handle — gives a visible grab target */}
          <span
            className={styles.dragHandle}
            aria-hidden="true"
            title="Drag to reorder"
          >
            ⠿
          </span>

          <div className={styles.left}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={task.isComplete}
              onChange={() => onToggle(task.id, task.isComplete)}
              aria-label={`Mark "${task.title}" as ${task.isComplete ? 'incomplete' : 'complete'}`}
            />
          </div>

          <div className={styles.body}>
            <p className={styles.title}>{task.title}</p>
            {task.description && (
              <p className={styles.description}>{task.description}</p>
            )}
            <div className={styles.meta}>
              {task.dueDate && (
                <span className={`${styles.dueDate} ${overdue ? styles.overdueText : ''}`}>
                  {overdue && <span className={styles.overdueIcon} aria-label="Overdue">⚠ </span>}
                  Due: {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
              aria-label={`Edit task "${task.title}"`}
              title="Edit"
            >
              ✏️
            </button>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              aria-label={`Delete task "${task.title}"`}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
