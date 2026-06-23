import ChatMessage from "../models/ChatMessage.js";
import Team from "../models/Team.js";
import { emitChatMessage } from "../utils/notificationService.js";

export const getMessages = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team || !team.isMember(req.user.id)) {
      const error = new Error("Team not found or access denied");
      error.statusCode = 403;
      throw error;
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      ChatMessage.find({ team: team._id })
        .populate("sender", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ChatMessage.countDocuments({ team: team._id }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(),
      total,
      page: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team || !team.isMember(req.user.id)) {
      const error = new Error("Team not found or access denied");
      error.statusCode = 403;
      throw error;
    }

    const message = await ChatMessage.create({
      team: team._id,
      sender: req.user.id,
      content: content.trim(),
    });

    const populated = await ChatMessage.findById(message._id).populate("sender", "name email avatar");
    emitChatMessage(team._id, populated);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await ChatMessage.findOne({
      _id: req.params.messageId,
      sender: req.user.id,
    });
    if (!message) {
      const error = new Error("Message not found");
      error.statusCode = 404;
      throw error;
    }
    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};
