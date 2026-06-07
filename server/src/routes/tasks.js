// routes/tasks.js — All CRUD route handlers for /api/tasks
//
// Route overview:
//   GET    /api/tasks       → return all tasks, newest first
//   POST   /api/tasks       → create a new task
//   PUT    /api/tasks/:id   → update an existing task (partial update supported)
//   DELETE /api/tasks/:id   → delete a task by id
//
// Note: `require('../db')` returns a Promise. We resolve it once at module load
// time via a module-level `let db` that is populated in `getDb()`.

const express = require('express');
const router  = express.Router();

// db is the wrapper object resolved from the sql.js init promise.
// We resolve it lazily on the first request (the app already awaits it in
// index.js, so by the time any route runs the promise is fulfilled).
let db;
async function getDb() {
  if (!db) db = await require('../db');
  return db;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// sql.js returns numbers for INTEGER columns; convert 0/1 → boolean for
// the JSON response so the frontend receives proper JS types.
function formatTask(row) {
  if (!row) return row;
  return { ...row, isComplete: row.isComplete === 1 };
}

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db    = await getDb();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
    res.json(tasks.map(formatTask));
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, description = null, dueDate = null } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const db        = await getDb();
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
// Supports partial updates — fields not sent in the body keep their current values.
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db       = await getDb();
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Merge incoming fields with stored values
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
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db       = await getDb();
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
