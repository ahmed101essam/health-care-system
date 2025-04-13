const AppError = require("../utils/AppError");

const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((e) => {
    return e.message;
  });

  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  console.log(err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  err.message = err.message;
  if (err.name === "ValidationError") {
    error = handleValidationError(error);
  }
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};
