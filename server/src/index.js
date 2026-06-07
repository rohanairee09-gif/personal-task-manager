// index.js — Express app entry point
//
// sql.js initialises asynchronously (loads WebAssembly), so we wrap startup
// in an async IIFE and only begin listening once the DB is ready.

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

// Allow requests from the Vite dev server in development.
// In production, allow the deployed frontend URL (set via FRONTEND_URL env var)
// or fall back to * so any origin can connect.
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '*')
  : 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin }));

// Parse incoming JSON bodies so req.body is populated.
app.use(express.json());

// Disable caching for all API responses so browsers always fetch fresh data
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// We must wait for the DB module to finish loading the WASM binary and schema
// before registering routes that depend on it.

(async () => {
  // Await the db promise — this also creates tasks.db if it doesn't exist.
  await require('./db');

  // Mount all task CRUD routes after DB is ready.
  const tasksRouter = require('./routes/tasks');
  app.use('/api/tasks', tasksRouter);

  // Simple health-check endpoint
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => {
    console.log(`Task Manager API running on http://localhost:${PORT}`);
  });
})();
