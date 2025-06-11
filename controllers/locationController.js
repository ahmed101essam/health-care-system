const Location = require("../models/Location");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const qs = require("qs");

exports.addLocation = catchAsync(async (req, res, next) => {
  const body = {
    fees: req.body.fees,
    governorate: req.body.governorate,
    area: req.body.area,
    street: req.body.street,
    buildingNumber: req.body.buildingNumber,
    type: req.body.type,
    avgVisitTime: req.avgVisitTime,
    slots: req.body.slots,
    doctor: req.user.id,
    locPoint: req.body.locPoint,
    taxIdNumber: req.body.taxIdNumber,
    commercialRegistrationNumber: req.body.commercialRegistrationNumber,
  };

  const location = await Location({ ...body });
  res.status(201).json({
    data: {
      location,
    },
  });
});

exports.validLocationId = catchAsync(async (req, res, next) => {
  const locationId = req.params.locationId;

  const location = await Location.findById(locationId);

  if (!location) {
    return next(new AppError("The location id you provided is invalid", 400));
  }

  if (location.status !== "VERIFIED") {
    return next(new AppError("The location is not available right now", 404));
  }

  req.location = location;
  next();
});

exports.updateLocation = catchAsync(async (req, res, next) => {
  const allowedFields = [
    "fees",
    "avgVisitTime",
    "slots",
    "area",
    "street",
    "buildingNumber",
  ];

  // Update fields manually
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.location[field] = req.body[field];
    }
  });

  await req.location.save(); // Save updated document

  res.status(200).json({
    data: {
      location: req.location,
    },
  });
});

exports.doIOwnTheLocation = catchAsync(async (req, res, next) => {
  if (req.location.doctor !== req.user.id) {
    return next(new AppError("You don't authorized to perform that action"));
  }
  next();
});

exports.deleteLocation = catchAsync(async (req, res, next) => {
  req.location.status = "DELETED";
  await req.location.save();
  res.status(204).json({
    status: "success",
    message: "Location deleted successfully.",
  });
});

exports.verifyTheLocation = catchAsync(async (req, res, next) => {
  req.location.status = "VERIFIED";
  const location = await req.location.save();
  res.status(200).json({
    status: "success",
    data: {
      location,
    },
  });
});

exports.suspendTheLocation = catchAsync(async (req, res, next) => {
  req.location.status = "SUSPENDED";
  const location = await req.location.save();
  res.status(200).json({
    status: "success",
    data: {
      location,
    },
  });
});

exports.getLocation = catchAsync(async (req, res, next) => {
  const reqQuery = qs.parse(req._parsedUrl.query);
  const apiFeatures = new APIFeatures(Location.find({}), reqQuery)
    .filter()
    .fields("fees governorate points area type avgVisitTime slots doctor");
});
