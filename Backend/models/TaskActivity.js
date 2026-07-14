import mongoose from "mongoose";

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "status_changed",
        "priority_changed",
        "assigned",
        "due_date_changed",
        "subtask_added",
        "subtask_completed",
        "comment_added",
        "attachment_added",
        "attachment_removed",
        "label_changed",
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

taskActivitySchema.index({ task: 1, createdAt: -1 });

const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);
export default TaskActivity;
