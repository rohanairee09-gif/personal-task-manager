// hooks/useTasks.js — Custom hook encapsulating all task state and operations
//
// State management strategy:
//   • A single `tasks` array holds the source of truth fetched from the server.
//   • After every mutation (create / update / delete) we update the local state
//     optimistically / with the server response rather than re-fetching the
//     whole list — this keeps the UI snappy while staying in sync.
//   • `loading` and `error` give components feedback during async operations.

import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks';

export function useTasks() {
  // ── State ────────────────────────────────────────────────────────────────
  const [tasks, setTasks]     = useState([]);   // array of task objects
  const [loading, setLoading] = useState(true); // true while initial fetch is in flight
  const [error, setError]     = useState(null); // string | null

  // ── Initial load ─────────────────────────────────────────────────────────
  // Runs once on mount to populate the task list from the server.
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Add task ─────────────────────────────────────────────────────────────
  // Sends a POST, then prepends the returned task to the local list
  // (server already returns newest-first; prepending keeps that order).
  const addTask = useCallback(async (taskData) => {
    const newTask = await createTask(taskData);
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  // ── Toggle completion ─────────────────────────────────────────────────────
  // Flips `isComplete` for a single task and syncs with the server.
  const toggleTask = useCallback(async (id, currentValue) => {
    const updated = await updateTask(id, { isComplete: !currentValue });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  // ── Edit task ─────────────────────────────────────────────────────────────
  // Accepts a partial object of fields to change; server handles the merge.
  const editTask = useCallback(async (id, fields) => {
    const updated = await updateTask(id, fields);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  // ── Remove task ───────────────────────────────────────────────────────────
  // Deletes from server first; only removes from local state on success.
  const removeTask = useCallback(async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, addTask, toggleTask, editTask, removeTask };
}
