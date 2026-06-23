# TaskFlow Pro 2.0 — Enterprise SaaS MERN Task Manager

A production-ready, enterprise-level full-stack task management SaaS built with the **MERN** stack. TaskFlow Pro 2.0 extends the original Task Manager with real-time notifications, team collaboration, calendar scheduling, time tracking, file uploads, and an AI assistant.

🔗 **Live Demo:** [task-manager-app-theta-blue.vercel.app](https://task-manager-app-theta-blue.vercel.app)  
🔗 **API:** [task-manager-app-production-7c24.up.railway.app](https://task-manager-app-production-7c24.up.railway.app)

---

## Features

### Core (v1.0)
- JWT Authentication, Protected Routes, User Settings
- Task CRUD, Status/Priority/Category, Sub-tasks
- Search, Filter, Sort, Dashboard Analytics
- Kanban Board (Drag & Drop), Dark/Light Theme
- Soft Delete & Trash System

### Enterprise (v2.0)

| Feature | Capabilities |
|---------|-------------|
| **Real-Time Notifications** | Socket.IO, task updates, assignments, due date reminders, browser push, notification center, read/unread, history, toasts |
| **Team Collaboration** | Workspaces, teams, invite links, member management, task assignment, team dashboard, activity feed, team chat, role-based permissions |
| **Calendar View** | Monthly/weekly/daily views, drag-and-drop scheduling, due date visualization, filters & search |
| **Time Tracking** | Start/pause/resume/stop timer, manual entries, task logs, weekly/monthly reports, charts |
| **File Uploads** | Cloudinary storage for images, PDF, DOCX, PPTX, Excel, ZIP — preview, download, delete, drag & drop |
| **AI Assistant** | OpenAI-powered task breakdown, suggestions, priority prediction, productivity insights, chat interface |

### Roles & Permissions

| Role | Permissions |
|------|------------|
| **Admin** | Full access — manage workspace, teams, members, all tasks |
| **Manager** | Create/edit/delete tasks, assign, invite members |
| **Member** | Create/edit own tasks, view team content |
| **Viewer** | Read-only access |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4, Chart.js, react-big-calendar, date-fns, Socket.IO Client, @dnd-kit, Lucide React |
| Backend | Node.js, Express 5, Mongoose 8, Socket.IO, JWT, bcryptjs, Helmet, Rate Limiting, Multer, Cloudinary, OpenAI |
| Database | MongoDB Atlas |
| Deployment | Vercel (FE), Railway (BE) |

---

## Project Structure

```
Task Manager App/
├── Backend/
│   ├── config/          # db.js, cloudinary.js, socket.js
│   ├── controllers/     # auth, task, notification, workspace, team, time, file, ai, chat, calendar
│   ├── middleware/      # auth, errorHandler, rateLimiter, upload, permissions
│   ├── models/          # User, Task, Workspace, Team, Notification, TimeEntry, ChatMessage, Activity
│   ├── routes/          # API route definitions
│   ├── utils/           # notificationService, permissions
│   ├── jobs/            # dueDateReminder cron
│   └── server.js        # HTTP + Socket.IO entry point
│
├── Frontend/
│   └── src/
│       ├── components/  # NotificationCenter, WorkspaceSwitcher, FileUpload, TimerWidget, TeamChat, etc.
│       ├── context/     # Auth, Task, Theme, Toast, Socket, Notification, Workspace
│       ├── hooks/       # useDebounce, useTimer
│       ├── pages/       # Dashboard, Calendar, Teams, TimeTracking, AIAssistant, etc.
│       └── services/    # api.js, socket.js
│
└── README.md
```

---

## Database Design

```
User ──┬── owns ──> Workspace ── contains ──> Team
       │                │                      │
       │                └── members[]           └── members[], chat, activities
       │
       ├── creates ──> Task ── belongs to ──> Workspace / Team
       │                  ├── assignee (User)
       │                  ├── attachments[]
       │                  └── time entries
       │
       ├── receives ──> Notification
       └── logs ──> TimeEntry
```

### Key Models

- **Workspace** — `name`, `owner`, `members[{user, role}]`, `settings`
- **Team** — `name`, `workspace`, `members[{user, role}]`, `inviteCode`, `color`
- **Task** — extended with `workspace`, `team`, `assignee`, `scheduledDate`, `attachments[]`, `estimatedMinutes`, `loggedMinutes`
- **Notification** — `recipient`, `type`, `title`, `message`, `isRead`, linked entities
- **TimeEntry** — `user`, `task`, `startTime`, `endTime`, `duration`, `isRunning`, `isPaused`
- **ChatMessage** — `team`, `sender`, `content`
- **Activity** — `team`, `actor`, `action`, `description`

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register user |
| POST | `/login` | Login & JWT |
| GET | `/me` | Current user |
| PUT | `/profile` | Update profile |
| PUT | `/password` | Change password |

### Tasks — `/api/tasks`
| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/`, `/:id` | Task operations (team/workspace aware) |
| GET | `/stats` | Dashboard statistics |
| GET/PATCH/DELETE | `/trash/*` | Trash operations |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications (paginated) |
| GET | `/unread-count` | Unread count |
| PATCH | `/:id/read` | Mark as read |
| PATCH | `/read-all` | Mark all read |
| DELETE | `/:id` | Delete notification |

### Workspaces — `/api/workspaces`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create workspace |
| GET | `/` | List workspaces |
| GET | `/:id` | Workspace + teams |
| PUT | `/:id` | Update workspace |
| POST | `/:id/switch` | Switch active workspace |
| POST | `/:id/invite` | Invite member by email |
| PUT/DELETE | `/:id/members/:memberId` | Manage members |

### Teams — `/api/teams`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create team |
| GET | `/` | List teams |
| POST | `/join` | Join via invite code |
| GET | `/:id` | Team dashboard data |
| POST | `/:id/invite` | Invite member |
| POST | `/:id/regenerate-invite` | New invite link |
| GET | `/:id/activity` | Activity feed |
| GET/POST | `/:teamId/chat` | Team chat messages |

### Time Entries — `/api/time-entries`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List entries |
| GET | `/running` | Active timer |
| POST | `/start` | Start timer |
| PATCH | `/:id/pause\|resume\|stop` | Timer controls |
| POST | `/manual` | Manual entry |
| GET | `/reports` | Productivity reports |

### Files — `/api/files`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:taskId` | List attachments |
| POST | `/:taskId` | Upload files (multipart) |
| DELETE | `/:taskId/:attachmentId` | Delete file |

### Calendar — `/api/calendar`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Tasks by date range |
| PATCH | `/:id/schedule` | Reschedule task |

### AI — `/api/ai`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/breakdown` | AI task breakdown |
| POST | `/suggest` | Task suggestions |
| POST | `/predict-priority` | Priority prediction |
| GET | `/insights` | Productivity insights |
| POST | `/chat` | AI chat assistant |

### Socket.IO Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | Server → Client | New notification |
| `task_update` | Server → Client | Real-time task changes |
| `team_activity` | Server → Client | Team activity feed |
| `chat_message` | Server → Client | New chat message |
| `join_workspace` | Client → Server | Join workspace room |
| `join_team` | Client → Server | Join team room |

---

## Local Development

### Prerequisites
- Node.js 18+, MongoDB Atlas (or local MongoDB)
- Cloudinary account (for file uploads)
- OpenAI API key (for AI features)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # Fill in your credentials
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

**Frontend `.env`:**
```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_SOCKET_URL=http://127.0.0.1:5000
```

**Backend `.env`:**
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

---

## Deployment Guide

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `Backend`
3. Add environment variables from `.env.example`
4. Railway auto-assigns `PORT` — Socket.IO works on the same port

### Frontend (Vercel)
1. Connect repo, set root to `Frontend`
2. Add environment variables:
   - `VITE_API_URL` = your Railway API URL + `/api`
   - `VITE_SOCKET_URL` = your Railway URL (without `/api`)
3. Deploy

### Post-Deploy Checklist
- [ ] Add Vercel URL to backend CORS origins in `server.js`
- [ ] Verify MongoDB Atlas IP whitelist (0.0.0.0/0 for cloud)
- [ ] Test Socket.IO connection from production frontend
- [ ] Configure Cloudinary upload presets
- [ ] Set OpenAI API key and monitor usage

---

## Step-by-Step Implementation Order

1. **Security layer** — Helmet, rate limiting, mongo sanitize, RBAC middleware
2. **Models** — Workspace, Team, Notification, TimeEntry, extend Task/User
3. **Socket.IO** — HTTP server + authenticated socket rooms
4. **Notifications** — Schema, API, service, cron due-date reminders
5. **Teams** — Workspace/team CRUD, invites, activity logging, chat
6. **Calendar** — Date-range API, react-big-calendar with drag-and-drop
7. **Time Tracking** — Timer state machine, reports aggregation
8. **Files** — Multer + Cloudinary upload pipeline
9. **AI** — OpenAI integration with rate limiting
10. **Frontend** — Contexts, pages, lazy-loaded routes, responsive UI

---

## Author

**Zain Murtaza** — [GitHub](https://github.com/ZainMurtaza3532)

## License

ISC License
