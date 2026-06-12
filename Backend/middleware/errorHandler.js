// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
      error: "VALIDATION_ERROR",
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID format",
      error: "INVALID_ID",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
      error: "DUPLICATE_KEY",
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: "SERVER_ERROR",
  });
};

export default errorHandler;
