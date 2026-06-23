import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_updated",
        "task_completed",
        "task_due_soon",
        "task_overdue",
        "team_invite",
        "team_joined",
        "comment",
        "mention",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
