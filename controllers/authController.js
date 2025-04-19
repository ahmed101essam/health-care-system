const Patient = require("../models/Patient");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const Email = require("../utils/Email");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

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
exports.doctorSignup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    photo,
    nationalIdNumber,
    nationalIdPhoto,
    medicalLicenseNumber,
    medicalLicensePhoto,
    syndicateMembershipNumber,
    syndicateMembershipPhoto,
    specialization,
    description,
    certificatePhoto,
    university,
    email,
    password,
    dob,
    gender,
    role,
  } = req.body;

  // 1. Check for existing unique fields
  const existingEmail = await Doctor.findOne({ email });
  if (existingEmail) return next(new AppError("Email already exists.", 400));

  const existingPhone = await Doctor.findOne({ phone });
  if (existingPhone)
    return next(new AppError("Phone number already exists.", 400));

  const existingId = await Doctor.findOne({ nationalIdNumber });
  if (existingId) return next(new AppError("National ID already exists.", 400));

  const existingLicense = await Doctor.findOne({ medicalLicenseNumber });
  if (existingLicense)
    return next(new AppError("Medical license already exists.", 400));

  const existingSyndicate = await Doctor.findOne({ syndicateMembershipNumber });
  if (existingSyndicate)
    return next(new AppError("Syndicate membership already exists.", 400));

  // 2. Create the doctor
  const newDoctor = await Doctor.create({
    firstName,
    lastName,
    phone,
    photo,
    nationalIdNumber,
    nationalIdPhoto,
    medicalLicenseNumber,
    medicalLicensePhoto,
    syndicateMembershipNumber,
    syndicateMembershipPhoto,
    specialization,
    description,
    certificatePhoto,
    university,
    email,
    password,
    dob,
    gender,
    role,
    emailVerfied: false,
    status: "NOTVERIFIED",
  });

  // 3. Optionally send a verification email
  const token = newDoctor.generateVerificationToken?.(); // if you have that method
  await newDoctor.save({ validateBeforeSave: false });
  if (token) {
    const emailService = new Email(newDoctor, token);
    await emailService.sendVerification();
  }

  // 4. Respond
  res.status(201).json({
    status: "success",
    message: "Doctor registered successfully. Please verify your email.",
  });
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are forbidded to access to that resource", 403)
      );
    }
    next();
  });
};

exports.protect = (Model) => {
  return catchAsync(async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      return next(new AppError("The token is invalid", 400));
    }

    token = token.split(" ")[1];

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decodedToken, "171");

    const user = await Model.findById(decodedToken.id).select(
      "firstName lastName email"
    );

    user.role = decodedToken.role;

    req.user = user;
    next();
  });
};

const bcrypt = require("bcryptjs"); // Assuming you're hashing passwords

// Generate JWT Token
const signToken = (id, role) => {
  return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.doctorLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if doctor exists and password is correct
  const doctor = await Doctor.findOne({ email }).select("+password");

  if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) Check if account is verified
  if (!doctor.emailVerified) {
    return next(
      new AppError("Please verify your email before logging in.", 403)
    );
  }

  // 4) Generate token
  const token = signToken(doctor._id, "DOCTOR");

  // 5) Remove password from output
  doctor.password = undefined;

  res.status(200).json({
    status: "success",
    token,
    data: {
      doctor,
    },
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

exports.forgetPassword = catchAsync(async (req, res, next) => {
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

  const token = patient.generatePasswordResetToken();

  await patient.save();

  const email = new Email(patient, token);

  await email.sendPasswordReset();

  res.status(200).json({
    status: "success",
    message: "Password reset token has been sent to your email",
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  if (!req.body.token || !req.body.newPassword) {
    return next(
      new AppError("Please provide the token and the new password", 400)
    );
  }

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,40}$/.test(
      req.body.newPassword
    )
  ) {
    return next(
      new AppError("Please check the conditions of good password", 400)
    );
  }
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

  console.log(patient.passwordResetTokenExpireAt);

  if (
    new Date(patient.passwordResetTokenExpireAt).getTime() <
    new Date(Date.now()).getTime()
  ) {
    patient.passwordResetToken = undefined;
    patient.passwordResetTokenExpireAt = undefined;
    await patient.save();
    return next(new AppError("The verification token has been expired", 400));
  }

  if (!patient.validatePasswordResetToken(req.body.token)) {
    return next(new AppError("The password reset token is invalid", 400));
  }

  patient.password = req.body.newPassword;

  await patient.save();

  res.status(200).json({
    status: "success",
    message: "Password changed successfully please sign in again.",
  });
});
