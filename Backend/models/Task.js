import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    resourceType: { type: String, default: "auto" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    priority: {
      type: String,
      enum: { values: ["high", "medium", "low"], message: "{VALUE} is not a valid priority" },
      default: "medium",
    },
    status: {
      type: String,
      enum: { values: ["pending", "in-progress", "completed"], message: "{VALUE} is not a valid status" },
      default: "pending",
    },
    dueDate: { type: Date, default: null },
    scheduledDate: { type: Date, default: null },
    category: { type: String, trim: true, default: "General" },
    subTasks: [
      {
        title: { type: String, required: true, trim: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    attachments: [attachmentSchema],
    estimatedMinutes: { type: Number, default: 0, min: 0 },
    loggedMinutes: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, isDeleted: 1, status: 1 });
taskSchema.index({ user: 1, isDeleted: 1, priority: 1 });
taskSchema.index({ workspace: 1, isDeleted: 1 });
taskSchema.index({ team: 1, isDeleted: 1 });
taskSchema.index({ assignee: 1, isDeleted: 1 });
taskSchema.index({ dueDate: 1, isDeleted: 1 });
taskSchema.index({ scheduledDate: 1, isDeleted: 1 });
taskSchema.index({ title: "text", description: "text" });

const Task = mongoose.model("Task", taskSchema);
export default Task;
