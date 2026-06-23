import mongoose from "mongoose";
import crypto from "crypto";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    createdBy: {
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
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    inviteExpiresAt: { type: Date, default: null },
    color: { type: String, default: "#6366f1" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamSchema.index({ workspace: 1 });
teamSchema.index({ "members.user": 1 });

teamSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(16).toString("hex");
    this.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

teamSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role || null;
};

teamSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

const Team = mongoose.model("Team", teamSchema);
export default Team;
