const Doctor = require("../models/Doctor");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const qs = require("qs");

const doctorColumns =
  "firstName lastName phone photo specialization description university role status";

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  let object = { status: "VERIFIED" };
  if (req.user && req.user.role === "ADMIN") {
    object = {};
  }

  let query = Doctor.find(object);
  const reqQuery = qs.parse(req._parsedUrl.query);

  const apiFeatures = new APIFeatures(query, reqQuery);

  const doctors = await apiFeatures.filter().sort().fields().pagination().query;

  res.status(200).json({
    status: "success",
    data: {
      doctors,
    },
  });
});

exports.doctorIdExists = catchAsync(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const doctor = await Doctor.findById(doctorId).select(doctorColumns);

  if (!doctor) {
    return next(new AppError("The doctor id you provided is invalid"));
  }
  req.doctor = doctor;
  next();
});

exports.validDoctorId = catchAsync(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const doctor = await Doctor.findById(doctorId).select(doctorColumns);

  if (!doctor || doctor.status !== "VERIFIED") {
    return next(new AppError("The doctor id you provided is invalid"));
  }

  req.doctor = doctor;

  next();
});

exports.getDoctor = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      doctor: req.doctor,
    },
  });
});

exports.me = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user.id).select(
    "-password -emailVerified -status"
  );
  res.status(200).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const allowedFields = ["phone", "lastName", "photo", "description"];

  const body = {};

  Object.keys(req.body).map((k) => {
    if (allowedFields.includes(k)) {
      body[k] = req.body[k];
    }
  });

  const doctor = await Doctor.findByIdAndUpdate(
    req.user.id,
    {
      ...body,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      doctor,
    },
  });
});
