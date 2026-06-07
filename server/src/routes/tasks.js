// routes/tasks.js — All CRUD route handlers for /api/tasks
//
// Route overview:
//   GET    /api/tasks       → return all tasks, newest first
//   POST   /api/tasks       → create a new task
//   PUT    /api/tasks/:id   → update an existing task (partial update supported)
//   DELETE /api/tasks/:id   → delete a task by id
//
// The db instance is attached to router.db by index.js after the database
// initialises. This ensures all routes share the exact same in-memory database
// instance rather than re-resolving the promise and getting a fresh instance.

const express = require('express');
const router  = express.Router();

// Returns the shared database instance injected by index.js
function getDb() {
  return router.db;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTask(row) {
  if (!row) return row;
  return { ...row, isComplete: row.isComplete === 1 };
}

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db    = getDb();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
    res.json(tasks.map(formatTask));
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { title, description = null, dueDate = null } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const db        = getDb();
    const createdAt = new Date().toISOString();

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO tasks (title, description, dueDate, isComplete, createdAt)
      VALUES (@title, @description, @dueDate, @isComplete, @createdAt)
    `).run({ title: title.trim(), description, dueDate, isComplete: 0, createdAt });

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid);
    res.status(201).json(formatTask(newTask));
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const db       = getDb();
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const title       = req.body.title       !== undefined ? req.body.title.trim()  : existing.title;
    const description = req.body.description !== undefined ? req.body.description   : existing.description;
    const dueDate     = req.body.dueDate     !== undefined ? req.body.dueDate       : existing.dueDate;
    const isComplete  = req.body.isComplete  !== undefined
      ? (req.body.isComplete ? 1 : 0)
      : existing.isComplete;

    if (!title) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }

    db.prepare(`
      UPDATE tasks
      SET title = @title,
          description = @description,
          dueDate = @dueDate,
          isComplete = @isComplete
      WHERE id = @id
    `).run({ title, description, dueDate, isComplete, id: Number(id) });

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(formatTask(updated));
  } catch (err) {
    console.error(`PUT /api/tasks/${id} error:`, err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const db       = getDb();
    const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
    res.status(204).send();
  } catch (err) {
    console.error(`DELETE /api/tasks/${id} error:`, err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
