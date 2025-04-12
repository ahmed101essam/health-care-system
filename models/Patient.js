const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minLength: 3,
    maxLength: 15,
    required: [true, "Provide your first name."],
  },
  lastName: {
    type: String,
    minLength: 3,
    maxLength: 15,
    required: [true, "Provide your second name."],
  },
  phoneNumber: {
    type: String,
    unique: true,
    validate: {
      validator: function (v) {
        return /^01[0125][0-9]{8}$/.test(v);
      },
      message: (v) => `${v.value} is not a valid phone number.`,
    },
  },
  dateOfBirth: {
    type: Date,
    max: Date.now(),
    min: new Date(new Date().setFullYear(new Date().getFullYear() - 100)),
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Provide an email address."],
    validate: {
      validator: function (v) {
        return validator.isEmail(v);
      },
      message: (v) => `${v.value} is not a valid email`,
    },
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, "Provide your password."],
    // validate: {
    //   validator: function(v) {
    //     return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,40}$/.test(v);
    //   },
    //   message: v => `Password should be between 8-40 characters, containing at least one uppercase letter, one lowercase letter, one digit, and one special character.`
    // },
  },
  nationality: {
    type: String,
    required: [true, "Provide your nationality."],
  },
  nationalId: {
    type: String,
    required: [true, "Provide your national ID."],
  },
  address: {
    type: String,
  },
  gender: {
    type: String,
    enum: {
      values: ["M", "F"],
      message: (v) => `${v.value} is not supported`,
    },
    set: (v) => v.toUpperCase(), // Ensure gender is stored as uppercase
  },
  photo: {
    type: String,
    maxLength: 1000,
  },
  status: {
    type: String,
    enum: ["active", "suspended", "deleted", "unverified"],
    default: "unverified",
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationTokenExpires: {
    type: Date,
  },
  chronicDiseases: {
    type: [String], // Could be replaced with an enum or reference if you have predefined values
    default: [],
  },
  allergies: {
    type: [String], // Could be replaced with an enum or reference if you have predefined values
    default: [],
  },
});

patientSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    return next();
  } catch (error) {
    return next(error);
  }
});

patientSchema.methods.generateVerificationToken = function () {
  try {
    const verificationToken = crypto.randomInt(100000, 999999).toString();

    this.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    this.verificationTokenExpires = Date.now() + 15 * 60 * 1000;

    return verificationToken; // Return the plain token to send to the user
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw new Error("Failed to generate verification token");
  }
};

module.exports = mongoose.model("Patient", patientSchema);
