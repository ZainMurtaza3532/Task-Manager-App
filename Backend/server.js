import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { startDueDateReminderJob } from "./jobs/dueDateReminder.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import timeEntryRoutes from "./routes/timeEntryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

connectDB();

const app = express();
const server = http.createServer(app);

initSocket(server);
startDueDateReminderJob();

const corsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(apiLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TaskFlow Pro 2.0 API is running",
    version: "2.0.0",
    features: [
      "notifications",
      "teams",
      "calendar",
      "time-tracking",
      "files",
      "ai",
      "comments",
      "presence",
      "task-activity",
    ],
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/calendar", calendarRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 TaskFlow Pro 2.0 running on port ${PORT}`);
});
