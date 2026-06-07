// db.js — SQLite database initialisation using sql.js (pure JS, no native build)
//
// In production (Render), we run fully in-memory — no file persistence.
// This is because Render's free tier resets the filesystem on every restart,
// which caused deleted tasks to reappear. In-memory is honest: data lasts
// as long as the server is alive.
//
// In development, we persist to tasks.db so data survives local restarts.

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = path.join(__dirname, '..', 'tasks.db');

let dbWrapper = null;

async function init() {
  const SQL = await initSqlJs();

  // In production: always start with a fresh in-memory database.
  // In development: load from file if it exists, otherwise start fresh.
  let db;
  if (!IS_PROD && fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Persist helper — only writes to disk in development.
  function persist() {
    if (IS_PROD) return; // skip file writes on Render
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // ── Schema ──────────────────────────────────────────────────────────────
  const isNewDb = IS_PROD || !fs.existsSync(DB_PATH);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      dueDate     TEXT,
      isComplete  INTEGER NOT NULL DEFAULT 0,
      createdAt   TEXT    NOT NULL
    )
  `);

  if (isNewDb) {
    persist();
  }

  // ── Type fixer ───────────────────────────────────────────────────────────
  function fixTypes(row) {
    if (!row) return row;
    return {
      ...row,
      id:         row.id         !== undefined ? Number(row.id)         : row.id,
      isComplete: row.isComplete !== undefined ? Number(row.isComplete) : row.isComplete,
    };
  }

  dbWrapper = {
    exec(sql) {
      db.run(sql);
      persist();
    },

    prepare(sql) {
      return {
        run(params) {
          const stmt = db.prepare(sql);
          if (params && typeof params === 'object' && !Array.isArray(params)) {
            const named = {};
            for (const [k, v] of Object.entries(params)) {
              named[`@${k}`] = v;
            }
            stmt.run(named);
          } else {
            stmt.run(params ?? []);
          }
          stmt.free();
          persist();

          let lastInsertRowid = 0;
          try {
            const ridStmt = db.prepare('SELECT MAX(id) AS id FROM tasks');
            ridStmt.step();
            const obj = ridStmt.getAsObject();
            ridStmt.free();
            lastInsertRowid = Number(obj.id) || 0;
          } catch (_) {}

          return { lastInsertRowid };
        },

        get(params) {
          const stmt = db.prepare(sql);
          let result;
          if (params !== undefined) {
            stmt.bind(Array.isArray(params) ? params : [params]);
          }
          if (stmt.step()) {
            result = fixTypes(stmt.getAsObject());
          }
          stmt.free();
          return result;
        },

        all(params) {
          const stmt = db.prepare(sql);
          if (params !== undefined) {
            stmt.bind(Array.isArray(params) ? params : [params]);
          }
          const rows = [];
          while (stmt.step()) {
            rows.push(fixTypes(stmt.getAsObject()));
          }
          stmt.free();
          return rows;
        },
      };
    },
  };

  return dbWrapper;
}

module.exports = init();
