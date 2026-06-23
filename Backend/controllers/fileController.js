import Task from "../models/Task.js";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });

export const uploadFiles = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured) {
      const error = new Error("File upload service not configured");
      error.statusCode = 503;
      throw error;
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    if (!req.files || req.files.length === 0) {
      const error = new Error("No files uploaded");
      error.statusCode = 400;
      throw error;
    }

    const attachments = [];
    for (const file of req.files) {
      const isImage = file.mimetype.startsWith("image/");
      const result = await uploadToCloudinary(file.buffer, {
        folder: `taskflow/${req.user.id}`,
        resource_type: isImage ? "image" : "raw",
        public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      });

      attachments.push({
        filename: result.public_id,
        originalName: file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        resourceType: result.resource_type,
        uploadedBy: req.user.id,
      });
    }

    task.attachments.push(...attachments);
    await task.save();

    res.status(201).json({ success: true, data: task.attachments });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      const error = new Error("Attachment not found");
      error.statusCode = 404;
      throw error;
    }

    if (isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(attachment.publicId, {
          resource_type: attachment.resourceType || "auto",
        });
      } catch {
        // continue even if cloudinary delete fails
      }
    }

    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    next(error);
  }
};

export const getTaskAttachments = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId).select("attachments");
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ success: true, data: task.attachments });
  } catch (error) {
    next(error);
  }
};
