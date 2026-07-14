import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import TaskActivity from "../models/TaskActivity.js";
import Team from "../models/Team.js";
import { createNotification, emitTaskUpdate } from "../utils/notificationService.js";
import { getIO } from "../config/socket.js";
import { logActivity } from "./teamController.js";

const canAccessTask = async (task, userId) => {
  const uid = userId.toString();
  if (task.user?.toString() === uid || task.assignee?.toString() === uid) return true;
  if (task.team) {
    const teamDoc = await Team.findById(task.team);
    return teamDoc?.isMember(userId) ?? false;
  }
  return false;
};

const loadAccessibleTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  if (!(await canAccessTask(task, userId))) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  return task;
};

export const getComments = async (req, res, next) => {
  try {
    await loadAccessibleTask(req.params.id, req.user.id);
    const comments = await Comment.find({ task: req.params.id })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { content, mentions = [] } = req.body;
    if (!content?.trim()) {
      const error = new Error("Comment content is required");
      error.statusCode = 400;
      throw error;
    }

    const task = await loadAccessibleTask(req.params.id, req.user.id);

    const comment = await Comment.create({
      task: task._id,
      author: req.user.id,
      content: content.trim(),
      mentions,
    });

    await TaskActivity.create({
      task: task._id,
      actor: req.user.id,
      action: "comment_added",
      description: "added a comment",
      metadata: { commentId: comment._id },
    });

    if (task.team) {
      const teamDoc = await Team.findById(task.team);
      if (teamDoc) {
        await logActivity(
          teamDoc,
          teamDoc.workspace,
          req.user.id,
          "comment_added",
          "comment",
          comment._id,
          `Commented on "${task.title}"`
        );
      }
    }

    const recipients = new Set();
    if (task.user?.toString() !== req.user.id.toString()) recipients.add(task.user.toString());
    if (task.assignee && task.assignee.toString() !== req.user.id.toString()) {
      recipients.add(task.assignee.toString());
    }
    mentions.forEach((m) => {
      if (m.toString() !== req.user.id.toString()) recipients.add(m.toString());
    });

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        senderId: req.user.id,
        type: mentions.map(String).includes(recipientId) ? "mention" : "comment",
        title: mentions.map(String).includes(recipientId) ? "You were mentioned" : "New comment",
        message: `${req.user.name || "Someone"} commented on "${task.title}"`,
        taskId: task._id,
        teamId: task.team,
        workspaceId: task.workspace,
      });
    }

    const populated = await Comment.findById(comment._id).populate("author", "name email avatar");

    const io = getIO();
    if (io) {
      io.to(`task:${task._id}`).emit("task_comment", { taskId: task._id, comment: populated });
      emitTaskUpdate({ _id: task._id, team: task.team, workspace: task.workspace, user: task.user }, "comment_added");
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      throw error;
    }
    if (comment.author.toString() !== req.user.id.toString()) {
      const error = new Error("Not authorized to edit this comment");
      error.statusCode = 403;
      throw error;
    }
    await loadAccessibleTask(comment.task, req.user.id);

    comment.content = req.body.content?.trim() || comment.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate("author", "name email avatar");
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      throw error;
    }
    if (comment.author.toString() !== req.user.id.toString()) {
      const error = new Error("Not authorized to delete this comment");
      error.statusCode = 403;
      throw error;
    }
    await loadAccessibleTask(comment.task, req.user.id);
    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

export const getTaskActivity = async (req, res, next) => {
  try {
    await loadAccessibleTask(req.params.id, req.user.id);
    const activity = await TaskActivity.find({ task: req.params.id })
      .populate("actor", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: activity.length, data: activity });
  } catch (error) {
    next(error);
  }
};
