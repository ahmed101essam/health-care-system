const Patient = require("../models/Patient");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const Email = require("../utils/Email");

exports.patientSignup = catchAsync(async (req, res, next) => {
  const body = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    dateOfBirth: req.body.dateOfBirth,
    email: req.body.email,
    password: req.body.password,
    nationality: req.body.nationality,
    nationalId: req.body.nationalId,
    gender: req.body.gender,
    photo: req.body.photo,
  };

  const nationalIdExist = await Patient.findOne({
    nationalId: body.nationalId,
  });

  if (nationalIdExist)
    return next(new AppError("The national Id already exists.", 400));

  const existingEmail = await Patient.findOne({
    email: body.email,
  });

  if (existingEmail)
    return next(new AppError("The email already exists.", 400));

  const existingPhone = await Patient.findOne({
    phoneNumber: body.phoneNumber,
  });

  if (existingPhone)
    return next(new AppError("The phone number already exists.", 400));

  const patient = await Patient.create(body);

  console.log(patient);

  const token = patient.generateVerificationToken();

  const email = new Email(patient, token);

  await email.sendVerification();

  res.status(200).json({
    status: "success",
    message: "User created successfully please verify your email.",
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {});
