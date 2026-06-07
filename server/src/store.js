// store.js — Simple in-memory task store
// 
// A plain JavaScript Map that holds tasks for the lifetime of the server process.
// This is the single source of truth — all routes read and write to this store.
// Data resets when the server restarts (expected behaviour on free hosting).

const store = {
  tasks: new Map(), // id → task object
  nextId: 1,

  getAll() {
    // Return all tasks sorted by createdAt descending (newest first)
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(id) {
    return this.tasks.get(Number(id));
  },

  create({ title, description = null, dueDate = null }) {
    const task = {
      id:          this.nextId++,
      title:       title.trim(),
      description: description || null,
      dueDate:     dueDate || null,
      isComplete:  false,
      createdAt:   new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  },

  update(id, fields) {
    const task = this.tasks.get(Number(id));
    if (!task) return null;
    const updated = { ...task, ...fields, id: task.id, createdAt: task.createdAt };
    this.tasks.set(task.id, updated);
    return updated;
  },

  delete(id) {
    return this.tasks.delete(Number(id));
  },
};

module.exports = store;
