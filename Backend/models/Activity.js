import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "task_completed",
        "task_deleted",
        "task_assigned",
        "member_joined",
        "member_left",
        "member_role_changed",
        "team_created",
        "comment_added",
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ["task", "team", "member", "comment"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ team: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
