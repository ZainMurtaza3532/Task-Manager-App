import Task from "../models/Task.js";

// @desc    Get all active tasks (with search, filter, sort)
// @route   GET /api/tasks
export const getAllTasks = async (req, res, next) => {
  try {
    const { search, priority, status, category, sort, page = 1, limit = 50 } = req.query;

    // Build filter query
    const filter = { isDeleted: false, user: req.user.id };

    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    let sortOption = { createdAt: -1 }; // default: newest first
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "priority":
        sortOption = { priority: 1, createdAt: -1 };
        break;
      case "dueDate":
        sortOption = { dueDate: 1, createdAt: -1 };
        break;
      case "title":
        sortOption = { title: 1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: tasks,
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/stats
export const getTaskStats = async (req, res, next) => {
  try {
    const [stats] = await Task.aggregate([
      {
        $facet: {
          // Active task stats
          active: [
            { $match: { isDeleted: false, user: req.user._id } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                inProgress: {
                  $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
                },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                highPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
                },
                mediumPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] },
                },
                lowPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] },
                },
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
          // Trashed count
          trashed: [
            { $match: { isDeleted: true, user: req.user._id } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const activeStats = stats.active[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      overdue: 0,
    };
    const trashedCount = stats.trashed[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        ...activeStats,
        _id: undefined,
        trashedCount,
      },
      message: "Task statistics fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trashed tasks
// @route   GET /api/tasks/trash
export const getTrashedTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ isDeleted: true, user: req.user.id }).sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
      message: "Trashed tasks fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: task,
      message: "Task fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate, category } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      category,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: task,
      message: "Task created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Task updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete — move task to trash
// @route   PUT /api/tasks/:id/trash
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

    res.status(200).json({
      success: true,
      data: task,
      message: "Task moved to trash",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore task from trash
// @route   PUT /api/tasks/:id/restore
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

    res.status(200).json({
      success: true,
      data: task,
      message: "Task restored successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a task
// @route   DELETE /api/tasks/:id
export const permanentDeleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    res.status(200).json({
      success: true,
      data: {},
      message: "Task permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Empty trash — permanently delete all trashed tasks
// @route   DELETE /api/tasks/trash/empty
export const emptyTrash = async (req, res, next) => {
  try {
    const result = await Task.deleteMany({ isDeleted: true, user: req.user.id });

    res.status(200).json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} tasks permanently deleted from trash`,
    });
  } catch (error) {
    next(error);
  }
};
