// routes/tasks.js — All CRUD route handlers for /api/tasks
//
// Uses the in-memory store (store.js) instead of SQLite.
// This guarantees all routes share the same data within a server process.
//
// Route overview:
//   GET    /api/tasks       → return all tasks, newest first
//   POST   /api/tasks       → create a new task
//   PUT    /api/tasks/:id   → update an existing task
//   DELETE /api/tasks/:id   → delete a task by id

const express = require('express');
const router  = express.Router();
const store   = require('../store');

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json(store.getAll());
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const task = store.create({ title, description, dueDate });
  res.status(201).json(task);
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = store.getById(id);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const { title, description, dueDate, isComplete } = req.body;

  // Only update fields that were actually sent
  const fields = {};
  if (title       !== undefined) fields.title       = title.trim();
  if (description !== undefined) fields.description = description || null;
  if (dueDate     !== undefined) fields.dueDate     = dueDate || null;
  if (isComplete  !== undefined) fields.isComplete  = Boolean(isComplete);

  if (fields.title === '') {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }

  const updated = store.update(id, fields);
  res.json(updated);
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existing = store.getById(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  store.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
