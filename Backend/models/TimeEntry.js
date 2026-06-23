import mongoose from "mongoose";

const timeEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    isManual: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date, default: null },
    totalPausedMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ task: 1, user: 1 });

timeEntrySchema.methods.calculateDuration = function () {
  if (!this.endTime && !this.isRunning) return this.duration;
  const end = this.endTime || new Date();
  let elapsed = end - this.startTime - (this.totalPausedMs || 0);
  if (this.isPaused && this.pausedAt) {
    elapsed -= Date.now() - this.pausedAt;
  }
  return Math.max(0, Math.floor(elapsed / 1000));
};

const TimeEntry = mongoose.model("TimeEntry", timeEntrySchema);
export default TimeEntry;
