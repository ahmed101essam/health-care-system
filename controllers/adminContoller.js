const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminSignin = catchAsync(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const admin = await Admin.findOne({ email: req.body.email }).select(
    "firstName lastName email +password status"
  );

  if (!admin || admin.status !== "ACTIVE") {
    return next(new AppError("The account is suspended or does not exist"));
  }

  if (!(await bcrypt.compare(req.body.password, admin.password))) {
    return next(new AppError("The password is invalid"));
  }

  const token = await jwt.sign(
    { id: admin._id, role: "ADMIN" },
    process.env.JWT_SECRET
  );

  admin.password = undefined;
  res.status(200).json({
    status: "success",
    token,
    data: {
      admin,
    },
  });
});
