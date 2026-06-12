import mongoose from "mongoose";

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
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    priority: {
      type: String,
      enum: {
        values: ["high", "medium", "low"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in-progress", "completed"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    subTasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt
  }
);

// Indexes for query performance
taskSchema.index({ user: 1, isDeleted: 1, status: 1 });
taskSchema.index({ user: 1, isDeleted: 1, priority: 1 });
taskSchema.index({ title: "text", description: "text" });

const Task = mongoose.model("Task", taskSchema);

export default Task;
