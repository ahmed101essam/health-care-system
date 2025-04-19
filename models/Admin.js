const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide an email"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false, // Prevent password from being returned in queries
  },
  firstName: {
    type: String,
    required: [true, "Please provide admin first name"],
    trim: true,
    minlength: [2, "First name must be at least 2 characters"],
    maxlength: [30, "First name must be at most 30 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Please provide admin last name"],
    trim: true,
    minlength: [2, "Last name must be at least 2 characters"],
    maxlength: [30, "Last name must be at most 30 characters"],
  },
  nationalId: {
    type: String,
    required: [true, "Please provide admin national ID"],
    unique: true,
    minlength: [14, "National ID must be 14 digits"],
    maxlength: [14, "National ID must be 14 digits"],
    validate: {
      validator: (v) => /^\d{14}$/.test(v),
      message: "National ID must be a 14-digit number",
    },
  },
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED", "INACTIVE"],
    default: "ACTIVE",
  },
});

adminSchema.pre("save", async function (next) {
  if (!this.isNew || !this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
