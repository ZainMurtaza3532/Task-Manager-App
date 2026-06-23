import TimeEntry from "../models/TimeEntry.js";
import Task from "../models/Task.js";

const updateTaskLoggedTime = async (taskId) => {
  const entries = await TimeEntry.find({ task: taskId, isRunning: false });
  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  await Task.findByIdAndUpdate(taskId, { loggedMinutes: Math.ceil(totalSeconds / 60) });
};

export const getTimeEntries = async (req, res, next) => {
  try {
    const { taskId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user.id };
    if (taskId) filter.task = taskId;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [entries, total] = await Promise.all([
      TimeEntry.find(filter)
        .populate("task", "title status priority")
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TimeEntry.countDocuments(filter),
    ]);

    res.json({ success: true, data: entries, total, page: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

export const getRunningTimer = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ user: req.user.id, isRunning: true })
      .populate("task", "title status priority");
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const startTimer = async (req, res, next) => {
  try {
    const { taskId, description } = req.body;
    const task = await Task.findById(taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    await TimeEntry.updateMany(
      { user: req.user.id, isRunning: true },
      { isRunning: false, endTime: new Date() }
    );

    const entry = await TimeEntry.create({
      user: req.user.id,
      task: taskId,
      workspace: task.workspace,
      description: description || "",
      startTime: new Date(),
      isRunning: true,
    });

    const populated = await TimeEntry.findById(entry._id).populate("task", "title status priority");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const pauseTimer = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, user: req.user.id, isRunning: true });
    if (!entry) {
      const error = new Error("No running timer found");
      error.statusCode = 404;
      throw error;
    }

    entry.isPaused = true;
    entry.pausedAt = new Date();
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const resumeTimer = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, user: req.user.id, isRunning: true, isPaused: true });
    if (!entry) {
      const error = new Error("No paused timer found");
      error.statusCode = 404;
      throw error;
    }

    if (entry.pausedAt) {
      entry.totalPausedMs += Date.now() - entry.pausedAt.getTime();
    }
    entry.isPaused = false;
    entry.pausedAt = null;
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const stopTimer = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, user: req.user.id, isRunning: true });
    if (!entry) {
      const error = new Error("No running timer found");
      error.statusCode = 404;
      throw error;
    }

    entry.isRunning = false;
    entry.isPaused = false;
    entry.endTime = new Date();
    entry.duration = entry.calculateDuration();
    await entry.save();

    await updateTaskLoggedTime(entry.task);
    const populated = await TimeEntry.findById(entry._id).populate("task", "title status priority");
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const createManualEntry = async (req, res, next) => {
  try {
    const { taskId, startTime, endTime, description } = req.body;
    const task = await Task.findById(taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / 1000);

    const entry = await TimeEntry.create({
      user: req.user.id,
      task: taskId,
      workspace: task.workspace,
      description: description || "",
      startTime: start,
      endTime: end,
      duration,
      isManual: true,
      isRunning: false,
    });

    await updateTaskLoggedTime(taskId);
    const populated = await TimeEntry.findById(entry._id).populate("task", "title status priority");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteTimeEntry = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) {
      const error = new Error("Time entry not found");
      error.statusCode = 404;
      throw error;
    }
    await updateTaskLoggedTime(entry.task);
    res.json({ success: true, message: "Time entry deleted" });
  } catch (error) {
    next(error);
  }
};

export const getTimeReports = async (req, res, next) => {
  try {
    const { period = "week" } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    const entries = await TimeEntry.find({
      user: req.user.id,
      startTime: { $gte: startDate },
      isRunning: false,
    }).populate("task", "title category");

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const byDay = {};
    const byTask = {};
    const byCategory = {};

    entries.forEach((entry) => {
      const day = entry.startTime.toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + entry.duration;
      const taskTitle = entry.task?.title || "Unknown";
      byTask[taskTitle] = (byTask[taskTitle] || 0) + entry.duration;
      const cat = entry.task?.category || "General";
      byCategory[cat] = (byCategory[cat] || 0) + entry.duration;
    });

    const dailyBreakdown = Object.entries(byDay)
      .map(([date, seconds]) => ({ date, hours: +(seconds / 3600).toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const taskBreakdown = Object.entries(byTask)
      .map(([task, seconds]) => ({ task, hours: +(seconds / 3600).toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        period,
        totalHours: +(totalSeconds / 3600).toFixed(2),
        totalEntries: entries.length,
        dailyBreakdown,
        taskBreakdown,
        categoryBreakdown: Object.entries(byCategory).map(([category, seconds]) => ({
          category,
          hours: +(seconds / 3600).toFixed(2),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeLogs = async (req, res, next) => {
  try {
    const entries = await TimeEntry.find({ task: req.params.taskId, user: req.user.id })
      .sort({ startTime: -1 });
    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || e.calculateDuration?.() || 0), 0);
    res.json({
      success: true,
      data: { entries, totalHours: +(totalSeconds / 3600).toFixed(2) },
    });
  } catch (error) {
    next(error);
  }
};
