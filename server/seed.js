// seed.js — Populates the database with a few sample tasks.
// Run once with: node seed.js
// Safe to re-run — it checks if tasks already exist before inserting.

const getDb = require('./src/db');

const samples = [
  {
    title:       'Buy groceries',
    description: 'Milk, eggs, bread, and coffee',
    dueDate:     new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isComplete:  0,
  },
  {
    title:       'Read documentation',
    description: 'Go through the React hooks docs',
    dueDate:     null,
    isComplete:  0,
  },
  {
    title:       'Submit assignment',
    description: null,
    dueDate:     new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isComplete:  0,
  },
];

getDb().then((db) => {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  if (existing.count > 0) {
    console.log(`Database already has ${existing.count} task(s). Skipping seed.`);
    process.exit(0);
  }

  const createdAt = new Date().toISOString();
  for (const task of samples) {
    db.prepare(`
      INSERT INTO tasks (title, description, dueDate, isComplete, createdAt)
      VALUES (@title, @description, @dueDate, @isComplete, @createdAt)
    `).run({ ...task, createdAt });
  }

  console.log(`Seeded ${samples.length} sample tasks.`);
  process.exit(0);
});
