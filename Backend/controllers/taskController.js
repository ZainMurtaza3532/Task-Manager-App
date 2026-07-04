import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { createNotification, emitTaskUpdate } from "../utils/notificationService.js";
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

const buildTaskFilter = (req) => {
  const { search, priority, status, category, sort, page = 1, limit = 50, team, workspace } = req.query;

  const filter = {
    isDeleted: false,
    $or: [{ user: req.user.id }, { assignee: req.user.id }],
  };

  if (team) filter.team = team;
  if (workspace) filter.workspace = workspace;
  if (priority && priority !== "all") filter.priority = priority;
  if (status && status !== "all") filter.status = status;
  if (category && category !== "all") filter.category = category;
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });
  }

  let sortOption = { createdAt: -1 };
  switch (sort) {
    case "oldest": sortOption = { createdAt: 1 }; break;
    case "priority": sortOption = { priority: 1, createdAt: -1 }; break;
    case "dueDate": sortOption = { dueDate: 1, createdAt: -1 }; break;
    case "title": sortOption = { title: 1 }; break;
  }

  return { filter, sortOption, page: parseInt(page), limit: parseInt(limit) };
};

export const getAllTasks = async (req, res, next) => {
  try {
    const { filter, sortOption, page, limit } = buildTaskFilter(req);
    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .populate("assignee", "name email avatar")
      .populate("team", "name color")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [stats] = await Task.aggregate([
      {
        $facet: {
          active: [
            { $match: { isDeleted: false, $or: [{ user: userId }, { assignee: userId }] } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                mediumPriority: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                lowPriority: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$status", "completed"] },
                          { $ne: ["$dueDate", null] },
                          { $lt: ["$dueDate", new Date()] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          trashed: [
            { $match: { isDeleted: true, user: userId } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const activeStats = stats.active[0] || {
      total: 0, pending: 0, inProgress: 0, completed: 0,
      highPriority: 0, mediumPriority: 0, lowPriority: 0, overdue: 0,
    };
    const trashedCount = stats.trashed[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: { ...activeStats, _id: undefined, trashedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrashedTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ isDeleted: true, user: req.user.id }).sort({ deletedAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email avatar")
      .populate("team", "name color");

    if (!task || task.isDeleted) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    if (!(await canAccessTask(task, req.user.id))) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title, description, priority, status, dueDate, category,
      subTasks, team, workspace, assignee, scheduledDate, estimatedMinutes,
    } = req.body;

    const taskData = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      scheduledDate: scheduledDate || null,
      category,
      subTasks: subTasks || [],
      user: req.user.id,
      createdBy: req.user.id,
      estimatedMinutes: estimatedMinutes || 0,
    };

    if (team) {
      const teamDoc = await Team.findById(team);
      if (!teamDoc || !teamDoc.isMember(req.user.id)) {
        const error = new Error("Not authorized to create tasks for this team");
        error.statusCode = 403;
        throw error;
      }
      taskData.team = team;
      taskData.workspace = teamDoc.workspace;
    }
    if (workspace && !taskData.workspace) taskData.workspace = workspace;

    if (assignee) {
      if (taskData.team) {
        const teamDoc = await Team.findById(taskData.team);
        if (!teamDoc?.isMember(assignee)) {
          const error = new Error("Assignee must be a member of this team");
          error.statusCode = 400;
          throw error;
        }
      }
      taskData.assignee = assignee;
    }

    const task = await Task.create(taskData);
    const populated = await Task.findById(task._id)
      .populate("assignee", "name email avatar")
      .populate("team", "name color");

    emitTaskUpdate(populated.toObject(), "task_created");

    if (assignee && assignee !== req.user.id) {
      await createNotification({
        recipientId: assignee,
        senderId: req.user.id,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You've been assigned: "${title}"`,
        taskId: task._id,
        teamId: team,
        workspaceId: taskData.workspace,
      });
    }

    if (team) {
      const teamDoc = await Team.findById(team);
      if (teamDoc) {
        await logActivity(teamDoc, teamDoc.workspace, req.user.id, "task_created", "task", task._id, `Task "${title}" was created`);
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    if (!(await canAccessTask(task, req.user.id))) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const previousAssignee = task.assignee?.toString();
    const previousStatus = task.status;

    if (req.body.assignee && task.team) {
      const teamDoc = await Team.findById(task.team);
      if (!teamDoc?.isMember(req.body.assignee)) {
        const error = new Error("Assignee must be a member of this team");
        error.statusCode = 400;
        throw error;
      }
    }

    Object.assign(task, req.body);
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email avatar")
      .populate("team", "name color");

    emitTaskUpdate(populated.toObject(), "task_updated");

    if (req.body.assignee && req.body.assignee !== previousAssignee && req.body.assignee !== req.user.id) {
      await createNotification({
        recipientId: req.body.assignee,
        senderId: req.user.id,
        type: "task_assigned",
        title: "Task Assigned",
        message: `You've been assigned: "${task.title}"`,
        taskId: task._id,
      });
    }

    if (req.body.status === "completed" && previousStatus !== "completed") {
      await createNotification({
        recipientId: task.user,
        senderId: req.user.id,
        type: "task_completed",
        title: "Task Completed",
        message: `"${task.title}" has been marked as completed`,
        taskId: task._id,
      });
      if (task.team) {
        const teamDoc = await Team.findById(task.team);
        if (teamDoc) {
          await logActivity(teamDoc, teamDoc.workspace, req.user.id, "task_completed", "task", task._id, `Task "${task.title}" was completed`);
        }
      }
    }

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const softDeleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();
    res.status(200).json({ success: true, data: task, message: "Task moved to trash" });
  } catch (error) {
    next(error);
  }
};

export const restoreTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    task.isDeleted = false;
    task.deletedAt = null;
    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, message: "Task permanently deleted" });
  } catch (error) {
    next(error);
  }
};

export const emptyTrash = async (req, res, next) => {
  try {
    const result = await Task.deleteMany({ isDeleted: true, user: req.user.id });
    res.status(200).json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} tasks permanently deleted`,
    });
  } catch (error) {
    next(error);
  }
};
