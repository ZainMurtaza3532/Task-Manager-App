import Task from "../models/Task.js";

export const getCalendarTasks = async (req, res, next) => {
  try {
    const { start, end, team, workspace, status, priority, search } = req.query;

    if (!start || !end) {
      const error = new Error("Start and end dates are required");
      error.statusCode = 400;
      throw error;
    }

    const filter = {
      isDeleted: false,
      $or: [
        { user: req.user.id },
        { assignee: req.user.id },
      ],
      $and: [
        {
          $or: [
            { dueDate: { $gte: new Date(start), $lte: new Date(end) } },
            { scheduledDate: { $gte: new Date(start), $lte: new Date(end) } },
          ],
        },
      ],
    };

    if (team) filter.team = team;
    if (workspace) filter.workspace = workspace;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    const tasks = await Task.find(filter)
      .populate("assignee", "name email avatar")
      .populate("team", "name color")
      .sort({ dueDate: 1, scheduledDate: 1 });

    const events = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      start: task.scheduledDate || task.dueDate,
      end: task.scheduledDate || task.dueDate,
      allDay: true,
      resource: {
        status: task.status,
        priority: task.priority,
        category: task.category,
        assignee: task.assignee,
        team: task.team,
        dueDate: task.dueDate,
        scheduledDate: task.scheduledDate,
      },
    }));

    res.json({ success: true, data: { tasks, events } });
  } catch (error) {
    next(error);
  }
};

export const scheduleTask = async (req, res, next) => {
  try {
    const { scheduledDate, dueDate } = req.body;
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { assignee: req.user.id }],
    });

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    if (scheduledDate !== undefined) task.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    await task.save();

    const { emitTaskUpdate } = await import("../utils/notificationService.js");
    emitTaskUpdate(task.toObject(), "task_scheduled");

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};
