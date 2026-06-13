# ✅ TaskFlow Pro — MERN Task Manager

A full-stack task management application built with the **MERN** stack (MongoDB, Express, React, Node.js). Manage your tasks with a modern, responsive UI featuring a Kanban board, analytics dashboard, dark/light themes, and more.

🔗 **Live Demo:** [task-manager-app-theta-blue.vercel.app](https://task-manager-app-theta-blue.vercel.app)
🔗 **API Base:** [task-manager-app-production-7c24.up.railway.app](https://task-manager-app-production-7c24.up.railway.app)

---

## 🚀 Features

### Task Management
- ✏️ Create, edit, and delete tasks with title, description, due date, priority, category, and sub-tasks
- 📊 Three status levels — **Pending**, **In Progress**, **Completed**
- 🔴🟡🟢 Three priority levels — **High**, **Medium**, **Low**
- 🗂️ Categorize tasks — General, Work, Personal, Shopping, Health, Finance, Education, Travel
- ✅ Sub-task checklists within each task
- 🔍 Search, filter, and sort tasks

### Views
- 📋 **Task List** — Filterable and sortable task cards
- 📌 **Kanban Board** — Drag-and-drop tasks across status columns (powered by `@dnd-kit`)
- 📈 **Dashboard** — Visual analytics with Chart.js (Pie chart for status, Bar chart for priority)
- ✅ **Completed Tasks** — Dedicated view for finished tasks

### User Experience
- 🌙 **Dark / Light Theme** toggle
- 🗑️ **Soft Delete & Trash** — Move tasks to trash, restore, or permanently delete
- 🧹 **Empty Trash** — Bulk permanent deletion
- 🔐 **Authentication** — JWT-based register, login, and protected routes
- ⚙️ **Settings** — Update profile name, email, and password

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client |
| **Chart.js + react-chartjs-2** | Dashboard analytics charts |
| **@dnd-kit** | Kanban drag-and-drop |
| **Lucide React** | Icon library |
| **date-fns** | Date formatting |
| **Tailwind CSS v4** | Utility-first styling |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express v5** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **cors** | Cross-origin resource sharing |
| **morgan** | HTTP request logging |
| **dotenv** | Environment variables |

### Deployment
| Service | Usage |
|---|---|
| **Vercel** | Frontend hosting |
| **Railway** | Backend hosting |
| **MongoDB Atlas** | Cloud database |

---

## 📁 Project Structure

```
Task Manager App/
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── EditModal.jsx       # Task edit modal
│   │   │   ├── FilterPanel.jsx     # Search & filter controls
│   │   │   ├── Header.jsx          # Top navigation bar
│   │   │   ├── Layout.jsx          # App shell layout
│   │   │   ├── ProtectedRoute.jsx  # Auth guard wrapper
│   │   │   ├── Sidebar.jsx         # Side navigation
│   │   │   ├── TaskCard.jsx        # Individual task card
│   │   │   └── TaskForm.jsx        # Task create/edit form
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── TaskContext.jsx      # Task CRUD state
│   │   │   ├── ThemeContext.jsx     # Dark/light theme
│   │   │   └── ToastContext.jsx     # Toast notifications
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── AddTask.jsx          # New task page
│   │   │   ├── CompletedTasks.jsx   # Completed tasks view
│   │   │   ├── Dashboard.jsx        # Analytics dashboard
│   │   │   ├── Kanban.jsx           # Kanban board view
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Settings.jsx         # User settings
│   │   │   ├── Signup.jsx           # Registration page
│   │   │   ├── Tasks.jsx            # All tasks view
│   │   │   └── Trash.jsx            # Trashed tasks
│   │   ├── services/
│   │   │   └── api.js               # Axios instance & API calls
│   │   ├── utils/
│   │   │   ├── constants.js         # App constants & API URL
│   │   │   └── helpers.js           # Utility functions
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── Backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   └── taskController.js        # Task CRUD logic
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── errorHandler.js          # Global error handler
│   ├── models/
│   │   ├── Task.js                  # Task Mongoose schema
│   │   └── User.js                  # User Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth routes
│   │   └── taskRoutes.js            # /api/tasks routes
│   ├── server.js                    # Express app entry point
│   ├── .env                         # Environment variables
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login & receive JWT | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |
| `PUT` | `/api/auth/profile` | Update name & email | ✅ |
| `PUT` | `/api/auth/password` | Change password | ✅ |

### Tasks — `/api/tasks`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/tasks` | Create a new task | ✅ |
| `GET` | `/api/tasks` | Get all active tasks (supports `?search`, `?status`, `?priority`, `?category`, `?sort`) | ✅ |
| `GET` | `/api/tasks/stats` | Get task statistics for dashboard | ✅ |
| `GET` | `/api/tasks/trash` | Get all trashed tasks | ✅ |
| `GET` | `/api/tasks/:id` | Get a single task | ✅ |
| `PUT` | `/api/tasks/:id` | Update a task | ✅ |
| `PATCH` | `/api/tasks/:id/trash` | Soft delete (move to trash) | ✅ |
| `PATCH` | `/api/tasks/:id/restore` | Restore from trash | ✅ |
| `DELETE` | `/api/tasks/:id` | Permanently delete a task | ✅ |
| `DELETE` | `/api/tasks/trash/empty` | Empty all trashed tasks | ✅ |

---

## ⚙️ Local Development Setup

### Prerequisites

- **Node.js** v18+ and **npm**
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/ZainMurtaza3532/Task-Manager-App.git
cd Task-Manager-App
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

> **Note:** For local development, update `API_BASE_URL` in `Frontend/src/utils/constants.js` to:
> ```js
> export const API_BASE_URL = "http://127.0.0.1:5000/api";
> ```

Start the frontend dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## 🌐 Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | [task-manager-app-theta-blue.vercel.app](https://task-manager-app-theta-blue.vercel.app) |
| Backend | Railway | [task-manager-app-production-7c24.up.railway.app](https://task-manager-app-production-7c24.up.railway.app) |
| Database | MongoDB Atlas | Cloud-hosted cluster |

### Environment Variables (Production)

**Backend (Railway):**
| Variable | Description |
|---|---|
| `PORT` | Server port (Railway auto-assigns) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |

---

## 👤 Author

**Zain Murtaza**

- GitHub: [@ZainMurtaza3532](https://github.com/ZainMurtaza3532)

---

## 📄 License

This project is licensed under the **ISC License**.
