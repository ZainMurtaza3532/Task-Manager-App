# TaskFlow - Enterprise SaaS MERN Task Manager

TaskFlow is a full-stack task management application built with the MERN stack. It combines personal productivity, team collaboration, real-time notifications, scheduling, time tracking, file uploads, and AI assistance into a single SaaS-ready app.

---

## Key Features

- Secure authentication with JWT and protected routes
- Task creation, editing, deletion, and rich details
- Priority, due dates, categories, and sub-task support
- Kanban board for drag-and-drop workflow
- Team workspaces, member roles, and permissions
- Real-time notifications and activity updates via Socket.IO
- Calendar scheduling and drag-and-drop rescheduling
- Time tracking with manual entries and reports
- File upload support via Cloudinary
- AI-powered task suggestions and breakdowns
- Responsive UI with dark/light theme support

---

## Tech Stack

- Frontend: React 19, Vite 6, React Router 7, Tailwind CSS 4, Chart.js, react-big-calendar, date-fns, Socket.IO Client, @dnd-kit, Lucide React
- Backend: Node.js, Express 5, Mongoose 8, Socket.IO, JWT, bcryptjs, Helmet, rate limiting, Multer, Cloudinary, OpenAI
- Database: MongoDB (Local or Atlas)

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
│   ├── jobs/            # dueDateReminder cron job
│   └── server.js        # HTTP + Socket.IO entry point
│
├── Frontend/
│   └── src/
│       ├── components/  # reusable UI components
│       ├── context/     # providers and hooks for auth, tasks, notifications, socket, theme
│       ├── hooks/       # custom hooks like useDebounce, useTimer
│       ├── pages/       # main views: Dashboard, Calendar, Teams, TimeTracking, AIAssistant, etc.
│       └── services/    # API client and socket helpers
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas or local MongoDB
- Cloudinary account for file uploads
- OpenAI API key for AI features

### Backend

```bash
cd Backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

Frontend `.env` example:

```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_SOCKET_URL=http://127.0.0.1:5000
```

Backend `.env` example:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

---

## API Overview

### Auth - `/api/auth`

- `POST /register` - Register a new user
- `POST /login` - Authenticate and issue JWT
- `GET /me` - Get current authenticated user
- `PUT /profile` - Update user profile
- `PUT /password` - Change password

### Tasks - `/api/tasks`

- `GET /` - List tasks
- `POST /` - Create a new task
- `GET /:id` - Get task details
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `GET /stats` - Fetch dashboard statistics
- `PATCH /trash/:id` - Soft delete / restore task

### Notifications - `/api/notifications`

- `GET /` - List notifications
- `GET /unread-count` - Get unread count
- `PATCH /:id/read` - Mark a notification as read
- `PATCH /read-all` - Mark all notifications as read
- `DELETE /:id` - Delete notification

### Workspaces - `/api/workspaces`

- `POST /` - Create workspace
- `GET /` - List workspaces
- `GET /:id` - Get workspace details
- `PUT /:id` - Update workspace
- `POST /:id/switch` - Switch active workspace
- `POST /:id/invite` - Invite workspace member
- `PUT /:id/members/:memberId` - Update member role
- `DELETE /:id/members/:memberId` - Remove a member

### Teams - `/api/teams`

- `POST /` - Create team
- `GET /` - List teams
- `POST /join` - Join team with invite code
- `GET /:id` - Get team details
- `POST /:id/invite` - Invite team member
- `POST /:id/regenerate-invite` - Regenerate invite link
- `GET /:id/activity` - Get team activity
- `GET /:teamId/chat` - Get team messages
- `POST /:teamId/chat` - Send chat message

### Time Entries - `/api/time-entries`

- `GET /` - List time entries
- `GET /running` - Get active timer
- `POST /start` - Start timer
- `PATCH /:id/pause` - Pause timer
- `PATCH /:id/resume` - Resume timer
- `PATCH /:id/stop` - Stop timer
- `POST /manual` - Create manual time entry
- `GET /reports` - Get reports

### Files - `/api/files`

- `GET /:taskId` - List attachments for task
- `POST /:taskId` - Upload attachment
- `DELETE /:taskId/:attachmentId` - Delete attachment

### Calendar - `/api/calendar`

- `GET /` - Fetch tasks by date range
- `PATCH /:id/schedule` - Reschedule task

### AI - `/api/ai`

- `POST /breakdown` - Generate task breakdown
- `POST /suggest` - Task suggestions
- `POST /predict-priority` - Predict priority
- `GET /insights` - Productivity insights
- `POST /chat` - AI chat assistant

### Socket.IO Events

- `notification` - Server -> Client: New notification
- `task_update` - Server -> Client: Real-time task updates
- `team_activity` - Server -> Client: Team activity feed
- `chat_message` - Server -> Client: New chat message
- `join_workspace` - Client -> Server: Join workspace room
- `join_team` - Client -> Server: Join team room

---

---

## Notes

- Frontend uses React 19 with Vite and Tailwind CSS.
- Backend uses Express 5, Mongoose 8, Socket.IO, and OpenAI integration.
- Designed for team collaboration, task management, scheduling, time tracking, file uploads, and AI-assisted productivity.
