import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";

export const createNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  taskId = null,
  teamId = null,
  workspaceId = null,
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    task: taskId,
    team: teamId,
    workspace: workspaceId,
    metadata,
  });

  const populated = await Notification.findById(notification._id)
    .populate("sender", "name email avatar")
    .populate("task", "title status priority")
    .lean();

  const io = getIO();
  if (io) {
    io.to(`user:${recipientId}`).emit("notification", populated);
  }

  return populated;
};

export const emitTaskUpdate = (task, eventType = "task_updated") => {
  const io = getIO();
  if (!io) return;

  const payload = { type: eventType, task };

  if (task.workspace) {
    io.to(`workspace:${task.workspace}`).emit("task_update", payload);
  }
  if (task.team) {
    io.to(`team:${task.team}`).emit("task_update", payload);
  }
  if (task.assignee) {
    io.to(`user:${task.assignee}`).emit("task_update", payload);
  }
  io.to(`user:${task.user}`).emit("task_update", payload);
};

export const emitTeamActivity = (teamId, activity) => {
  const io = getIO();
  if (io) {
    io.to(`team:${teamId}`).emit("team_activity", activity);
  }
};

export const emitChatMessage = (teamId, message) => {
  const io = getIO();
  if (io) {
    io.to(`team:${teamId}`).emit("chat_message", message);
  }
};

export const emitTimeEntryEvent = (userId, entry, eventType = "time_entry_updated") => {
  const io = getIO();
  if (!io || !userId) return;

  io.to(`user:${userId}`).emit(eventType, {
    type: eventType,
    entry,
  });
};
