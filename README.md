# Personal Task Manager

## Project Title & Description

This project is a **Personal Task Manager** web application, built as a full-stack technical assessment. The goal was to create a monorepo containing a REST API backend and a React frontend that together allow a user to create, view, edit, complete, and delete personal tasks. The app supports filtering tasks by status (All / Active / Completed), visually highlights overdue tasks, shows live active/completed counts, displays contextual empty states, and includes bonus features — search by title and drag-and-drop reordering.

---

## Live Demo Links

- **Frontend (Vercel):** https://personal-task-manager-smoky.vercel.app
- **Backend API (Render):** https://personal-task-manager-yft0.onrender.com

---

## Tech Stack

### Backend
| Tool | Version | Why |
|---|---|---|
| **Node.js** | 22.x | JavaScript runtime for the server |
| **Express** | 4.18 | Minimal, well-known HTTP framework for building REST APIs |
| **sql.js** | 1.12 | Pure-JS SQLite engine (WebAssembly). Chosen over `better-sqlite3` because it requires no native C++ compilation — works on any machine with just Node.js |
| **cors** | 2.8 | Allows the Vite dev server (port 5173) to call the API (port 3001) without browser CORS errors |
| **nodemon** | 3.0 | Dev-only. Auto-restarts the server on file save |

### Frontend
| Tool | Version | Why |
|---|---|---|
| **React** | 18.2 | UI component library. All components are functional with hooks — no class components |
| **Vite** | 5.1 | Fast dev server and build tool. Proxies `/api` calls to Express in development |
| **CSS Modules** | built-in | Scoped per-component CSS so styles never leak or conflict |
| **HTML5 Drag and Drop API** | browser built-in | Used for drag-to-reorder — no extra library needed |

---

## How to Run Locally

> Assumes only **Node.js** (v18 or later) is installed. No other global tools required.

### 1. Clone or download the project

```bash
# If using git
git clone <your-repo-url>
cd PersonalTM
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Seed the database with sample tasks (first time only)

```bash
node seed.js
```

### 4. Start the backend server

```bash
npm run dev
```

The API will be running at `http://localhost:3001`

### 5. Open a new terminal and install frontend dependencies

```bash
cd client
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

> Both terminals must stay open while using the app.

---

## API Documentation

Base URL: `http://localhost:3001`

---

### GET `/api/tasks`

Fetch all tasks, sorted by creation date (newest first).

**Request body:** none

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "dueDate": "2026-06-10",
    "isComplete": false,
    "createdAt": "2026-06-05T09:00:00.000Z"
  }
]
```

---

### POST `/api/tasks`

Create a new task.

**Request body:**
```json
{
  "title": "Buy groceries",       // required
  "description": "Milk, eggs",    // optional, null if omitted
  "dueDate": "2026-06-10"         // optional, null if omitted (YYYY-MM-DD)
}
```

**Response `201`:** returns the created task object (same shape as above)

**Response `400`:**
```json
{ "error": "Title is required." }
```

---

### PUT `/api/tasks/:id`

Update one or more fields on an existing task. Supports partial updates — only send the fields you want to change.

**Request body (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "dueDate": "2026-06-15",
  "isComplete": true
}
```

**Response `200`:** returns the full updated task object

**Response `404`:**
```json
{ "error": "Task not found." }
```

---

### DELETE `/api/tasks/:id`

Permanently delete a task by its id.

**Request body:** none

**Response `204`:** no content

**Response `404`:**
```json
{ "error": "Task not found." }
```

---

## Project Structure

```
PersonalTM/
│
├── client/                        # React + Vite frontend
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite config — proxies /api to Express
│   ├── package.json
│   └── src/
│       ├── main.jsx               # React root, mounts <App />
│       ├── App.jsx                # Root component — owns filter, search, drag-order state
│       ├── App.module.css
│       ├── api/
│       │   └── tasks.js           # All fetch() calls to the backend (single source)
│       ├── hooks/
│       │   └── useTasks.js        # Custom hook — task array, loading, CRUD operations
│       ├── components/
│       │   ├── TaskForm.jsx       # Controlled form to add a new task
│       │   ├── TaskForm.module.css
│       │   ├── FilterBar.jsx      # All / Active / Completed tabs + live counts
│       │   ├── FilterBar.module.css
│       │   ├── TaskList.jsx       # Renders list or empty state, manages drag events
│       │   ├── TaskList.module.css
│       │   ├── TaskItem.jsx       # Single task row — read view + inline edit + drag handle
│       │   └── TaskItem.module.css
│       └── styles/
│           └── global.css         # CSS custom properties (design tokens) + reset + dark mode
│
├── server/                        # Express + SQLite backend
│   ├── package.json
│   ├── seed.js                    # One-time script to insert 3 sample tasks
│   ├── tasks.db                   # SQLite database file (auto-created on first run)
│   └── src/
│       ├── index.js               # App entry point — starts Express server
│       ├── db.js                  # sql.js initialisation, file persistence, query wrapper
│       └── routes/
│           └── tasks.js           # All CRUD route handlers for /api/tasks
│
├── package.json                   # Monorepo root (convenience scripts)
├── .gitignore
└── README.md
```

---

## Next Steps

### Known limitations of free hosting

- **Render free tier** spins down after 15 minutes of inactivity and resets the filesystem on restart. This means the SQLite database resets when the server restarts. In production this would be solved by using a persistent database service (PostgreSQL on Railway or Neon) instead of a local SQLite file.

- **Drag-and-drop order persistence** — the reordered position is held in React state and resets on page refresh. Persisting it would require either a `sortOrder` column in the database or a separate PUT endpoint to save the order. Left out to keep scope reasonable.
- **User authentication** — all tasks are shared with anyone who opens the app. A real deployment would need login/signup and per-user task isolation.
- **Deployment** — no live deployment was set up. The backend would need to be hosted (e.g. Railway, Render) and the frontend deployed separately (e.g. Vercel, Netlify) with the API URL set via an environment variable.

### What I would build next

- **Auth** — add JWT-based login so each user has their own task list
- **Persist drag order** — add a `sortOrder` integer column and a `PATCH /api/tasks/reorder` endpoint
- **Due date notifications** — browser notifications or email reminders for tasks due soon
- **Task priorities** — low / medium / high priority with colour coding
- **Subtasks** — allow breaking a task into smaller checklist items
- **Dark/light mode toggle** — the CSS tokens are already set up for dark mode via `prefers-color-scheme`; adding a manual toggle would be straightforward
