import cron from "node-cron";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../utils/notificationService.js";

export const startDueDateReminderJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueSoonTasks = await Task.find({
        isDeleted: false,
        status: { $ne: "completed" },
        dueDate: { $gte: now, $lte: in24Hours },
      }).populate("assignee user");

      for (const task of dueSoonTasks) {
        const recipientId = task.assignee || task.user;
        const exists = await Notification.findOne({
          recipient: recipientId,
          task: task._id,
          type: "task_due_soon",
          createdAt: { $gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
        });
        if (!exists) {
          await createNotification({
            recipientId,
            type: "task_due_soon",
            title: "Task Due Soon",
            message: `"${task.title}" is due within 24 hours`,
            taskId: task._id,
          });
        }
      }

      const overdueTasks = await Task.find({
        isDeleted: false,
        status: { $ne: "completed" },
        dueDate: { $lt: now },
      });

      for (const task of overdueTasks) {
        const recipientId = task.assignee || task.user;
        const exists = await Notification.findOne({
          recipient: recipientId,
          task: task._id,
          type: "task_overdue",
          createdAt: { $gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
        });
        if (!exists) {
          await createNotification({
            recipientId,
            type: "task_overdue",
            title: "Task Overdue",
            message: `"${task.title}" is past its due date`,
            taskId: task._id,
          });
        }
      }
    } catch (error) {
      console.error("Due date reminder job error:", error.message);
    }
  });

  console.log("📅 Due date reminder cron job scheduled");
};
