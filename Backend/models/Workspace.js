import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: {
          type: String,
          enum: ["admin", "manager", "member", "viewer"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      allowMemberInvites: { type: Boolean, default: false },
      defaultTaskVisibility: { type: String, enum: ["private", "team", "workspace"], default: "team" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ "members.user": 1 });

workspaceSchema.methods.getMemberRole = function (userId) {
  if (this.owner.toString() === userId.toString()) return "admin";
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role || null;
};

workspaceSchema.methods.isMember = function (userId) {
  return this.owner.toString() === userId.toString() ||
    this.members.some((m) => m.user.toString() === userId.toString());
};

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
