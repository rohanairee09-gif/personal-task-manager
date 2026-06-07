// api/tasks.js — Centralised API layer
//
// In development, Vite proxies /api to localhost:3001 (see vite.config.js).
// In production (deployed), VITE_API_URL must be set to the backend URL,
// e.g. https://task-manager-api.onrender.com
// If neither is set, falls back to /api (works when frontend and backend
// are served from the same origin).

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/tasks`
  : '/api/tasks';

// Helper: throw a descriptive error when the server returns a non-2xx status.
async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  // 204 No Content has no body to parse
  if (res.status === 204) return null;
  return res.json();
}

// ─── Fetch all tasks ─────────────────────────────────────────────────────────
export async function fetchTasks() {
  const res = await fetch(BASE_URL);
  return handleResponse(res);
}

// ─── Create a task ───────────────────────────────────────────────────────────
export async function createTask(data) {
  // data shape: { title, description?, dueDate? }
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── Update a task ───────────────────────────────────────────────────────────
export async function updateTask(id, data) {
  // data shape: partial — any subset of { title, description, dueDate, isComplete }
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── Delete a task ───────────────────────────────────────────────────────────
export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
