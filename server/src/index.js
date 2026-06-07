// index.js — Express app entry point

const express    = require('express');
const cors       = require('cors');
const tasksRouter = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

const allowedOrigin = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '*')
  : 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Disable browser caching for all API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/tasks', tasksRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Task Manager API running on http://localhost:${PORT}`);
});
