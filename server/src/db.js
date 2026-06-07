// db.js — SQLite database initialisation using sql.js (pure JS, no native build)
//
// We use a module-level singleton so every require('./db') call returns
// the exact same database instance. This is critical — if different parts
// of the app get different instances, changes made in one won't be visible
// in the other.

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = path.join(__dirname, '..', 'tasks.db');

// THE singleton — only one db object ever exists in this process
let _db = null;

// Returns the singleton, initialising it on first call
async function getDb() {
  if (_db) return _db; // already initialised — return same instance

  const SQL = await initSqlJs();

  let db;
  if (!IS_PROD && fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  function persist() {
    if (IS_PROD) return;
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

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

  if (!IS_PROD) persist();

  function fixTypes(row) {
    if (!row) return row;
    return {
      ...row,
      id:         row.id         !== undefined ? Number(row.id)         : row.id,
      isComplete: row.isComplete !== undefined ? Number(row.isComplete) : row.isComplete,
    };
  }

  _db = {
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

  return _db;
}

module.exports = getDb;
