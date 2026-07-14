import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/User.js";

let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

export const setIO = (socketIO) => {
  io = socketIO;
};

export const getIO = () => io;

export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const broadcastPresence = (socketIO) => {
  socketIO.emit("presence_update", { onlineUserIds: getOnlineUserIds() });
};

export const initSocket = (server) => {
  const socketIO = new Server(server, {
    cors: {
      origin: [
        "https://task-manager-app-theta-blue.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  socketIO.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  socketIO.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    broadcastPresence(socketIO);
    socket.emit("presence_update", { onlineUserIds: getOnlineUserIds() });

    socket.on("join_workspace", (workspaceId) => {
      if (workspaceId) socket.join(`workspace:${workspaceId}`);
    });

    socket.on("join_team", (teamId) => {
      if (teamId) socket.join(`team:${teamId}`);
    });

    socket.on("leave_team", (teamId) => {
      if (teamId) socket.leave(`team:${teamId}`);
    });

    socket.on("join_task", (taskId) => {
      if (taskId) socket.join(`task:${taskId}`);
    });

    socket.on("leave_task", (taskId) => {
      if (taskId) socket.leave(`task:${taskId}`);
    });

    socket.on("get_online_users", (ack) => {
      if (typeof ack === "function") ack({ onlineUserIds: getOnlineUserIds() });
    });

    socket.on("typing_comment", ({ taskId, isTyping }) => {
      if (!taskId) return;
      socket.to(`task:${taskId}`).emit("comment_typing", {
        taskId,
        userId,
        userName: socket.user.name,
        isTyping: !!isTyping,
      });
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      broadcastPresence(socketIO);
    });
  });

  setIO(socketIO);
  return socketIO;
};
