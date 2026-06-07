// db.js — SQLite database initialisation using sql.js (pure JS, no native build)
//
// sql.js runs the SQLite engine compiled to WebAssembly, so it works on any
// Node version without a C++ compiler. The database is persisted to disk as a
// binary .db file and loaded back on every startup.
//
// API surface exposed by this module:
//   db.prepare(sql)  → statement object with .run(), .get(), .all()
//   db.exec(sql)     → execute multi-statement SQL (no results)
//   db.persist()     → write current in-memory state to disk
//                      (called internally after every write operation)

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.join(__dirname, '..', 'tasks.db');

// sql.js is async (loads the WASM binary); we export a promise that resolves
// to the wrapper object so the rest of the app can simply `await require('./db')`.
let dbWrapper = null;

async function init() {
  const SQL = await initSqlJs();

  // Load existing data from disk if the file is present, otherwise start fresh.
  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Persist helper — writes the in-memory database back to the .db file.
  function persist() {
    const data = db.export(); // returns Uint8Array
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // ── Schema ──────────────────────────────────────────────────────────────
  const isNewDb = !fs.existsSync(DB_PATH);

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

  // Only write back to disk if we just created a brand-new database.
  // If we loaded from an existing file we must NOT overwrite it here —
  // that would erase all saved tasks.
  if (isNewDb) {
    persist();
  }

  // ── Wrapper: mimic the better-sqlite3 synchronous API ───────────────────
  // sql.js uses a different (exec/prepare) API; this thin wrapper gives routes
  // a familiar .prepare().run() / .get() / .all() interface.

  // sql.js getAsObject() returns EVERY column value as a string.
  // This helper coerces the known integer columns back to proper JS types.
  function fixTypes(row) {
    if (!row) return row;
    return {
      ...row,
      id:         row.id         !== undefined ? Number(row.id)         : row.id,
      isComplete: row.isComplete !== undefined ? Number(row.isComplete) : row.isComplete,
    };
  }

  dbWrapper = {
    // Execute SQL that returns no rows (INSERT, UPDATE, DELETE, CREATE)
    exec(sql) {
      db.run(sql);
      persist();
    },

    // Prepare a parameterised statement.
    // Returns an object with three execution methods:
    //   .run(params)  — execute with no result needed; returns { lastInsertRowid }
    //   .get(params)  — execute and return the first row as an object (or undefined)
    //   .all(params)  — execute and return all rows as an array of objects
    prepare(sql) {
      return {
        run(params) {
          // Use db.prepare().run() so sql.js executes the statement correctly.
          const stmt = db.prepare(sql);

          if (params && typeof params === 'object' && !Array.isArray(params)) {
            // Named parameters: sql.js expects keys prefixed with '@'
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

          // sql.js does not reliably expose last_insert_rowid() after .run().
          // Instead we read the current maximum id from the tasks table,
          // which is always the row we just inserted (AUTOINCREMENT guarantees
          // ids only ever increase).
          let lastInsertRowid = 0;
          try {
            const ridStmt = db.prepare('SELECT MAX(id) AS id FROM tasks');
            ridStmt.step();
            const obj = ridStmt.getAsObject();
            ridStmt.free();
            lastInsertRowid = Number(obj.id) || 0;
          } catch (_) { /* non-INSERT statements won't have a tasks id */ }

          return { lastInsertRowid };
        },

        get(params) {
          const stmt = db.prepare(sql);
          let result;
          if (params !== undefined) {
            // Always pass as array; coerce a single scalar to [scalar]
            stmt.bind(Array.isArray(params) ? params : [params]);
          }
          if (stmt.step()) {
            // getAsObject() returns all values as strings — fix integer columns
            const row = stmt.getAsObject();
            result = fixTypes(row);
          }
          stmt.free();
          return result; // undefined if no row found
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

// Export the initialisation promise. Routes `await` it at startup.
module.exports = init();
