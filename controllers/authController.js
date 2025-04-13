const Patient = require("../models/Patient");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const Email = require("../utils/Email");
const jwt = require("jsonwebtoken");

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

  await patient.save();

  const email = new Email(patient, token);

  await email.sendVerification();

  res.status(200).json({
    status: "success",
    message: "User created successfully please verify your email.",
  });
});

exports.patientLogin = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOne({
    $or: [
      {
        nationalId: req.body.nationalIdOrEmail,
      },
      {
        email: req.body.nationalIdOrEmail,
      },
    ],
  });

  if (!patient) {
    return next(
      new AppError("There is no account found with that credentails", 400)
    );
  }

  if (!patient.emailVerified) {
    return next(new AppError("Verify your account first", 401));
  }

  if (!(await patient.correctPassword(req.body.password))) {
    return next(new AppError("The password is incorrect!", 400));
  }

  const token = jwt.sign({ id: patient.id }, process.env.JWT_SECRET);

  res.status(200).json({
    token,
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOne({
    email: req.body.email,
  });

  if (!patient) {
    return next(new AppError("There is no user found with that email", 400));
  }

  if (patient.emailVerified) {
    return next(new AppError("The user already verified his email", 400));
  }

  if (new Date(patient.emailVerificationTokenExpires) < new Date(Date.now())) {
    patient.emailVerificationToken = undefined;
    patient.emailVerificationTokenExpires = undefined;
    await patient.save();
    return next(new AppError("The verification token has been expired", 400));
  }

  if (!patient.validateVerificationToken(req.body.token)) {
    return next(new AppError("The verification token is invalid", 400));
  }
  patient.emailVerified = true;

  await patient.save();

  res.status(200).json({
    status: "success",
    message: "Email verified successfully please log in.",
  });
});

exports.resendVerification = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOne({
    $or: [
      {
        nationalId: req.body.nationalIdOrEmail,
      },
      {
        email: req.body.nationalIdOrEmail,
      },
    ],
  });

  if (!patient) {
    return next(new AppError("There is no user with that credentials", 400));
  }

  const token = patient.generateVerificationToken();

  await patient.save();

  const email = new Email(patient, token);
  await email.sendVerification();
  res.status(200).json({
    status: "success",
    message: "Please check your email.",
  });
});
