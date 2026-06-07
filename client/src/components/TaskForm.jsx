// TaskForm.jsx — Form for creating a new task
//
// Controlled form pattern: each input field is tied to a piece of local state.
// On submit we call the `onAdd` callback (provided by App) and reset the form.

import { useState } from 'react';
import styles from './TaskForm.module.css';

export default function TaskForm({ onAdd }) {
  // Local form state — lifted no further than this component needs
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    try {
      // Pass only non-empty optional fields to keep the payload clean
      await onAdd({
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate || null,
      });
      // Reset form on success
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Add New Task</h2>

      {error && <p className={styles.errorMsg} role="alert">⚠ {error}</p>}

      {/* Title spans full width */}
      <div className={`${styles.field} ${styles.fieldFull}`}>
        <label htmlFor="new-title">
          Title <span aria-hidden="true" className={styles.required}>*</span>
        </label>
        <input
          id="new-title"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* Description + Due Date side-by-side on desktop */}
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="new-desc">Description</label>
          <textarea
            id="new-desc"
            placeholder="Optional details…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="new-due">Due Date</label>
          <input
            id="new-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submitting}
      >
        {submitting ? 'Adding…' : '+ Add Task'}
      </button>
    </form>
  );
}
