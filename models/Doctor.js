const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Provide your first name"],
      minLength: 3,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: [true, "Provide your last name"],
      minLength: 3,
      maxLength: 20,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^01[0125][0-9]{8}$/.test(v);
        },
        message: (v) => `${v.value} is not a valid phone number.`,
      },
    },
    photo: {
      type: String,
      maxLength: 1000,
      required: [true, "Provide a professional photo"],
    },
    nationalIdNumber: {
      type: String,
      minLength: 14,
      maxLength: 14,
      unique: [true, "National id must be unique and it is already exists"],
      required: [true, "Provide your id number"],
    },
    medicalLicenseNumber: {
      type: String,
      unique: true,
      required: [true, "Provide your medical license number"],
    },
    syndicateMembershipNumber: {
      type: String,
      unique: true,
      required: [true, "Provide your syndicate membership number"],
    },
    nationalIdPhoto: {
      type: String,
      maxLength: 1000,
      required: [true, "Provide a national id photo"],
    },
    medicalLicensePhoto: {
      type: String,
      maxLength: 1000,
      required: [true, "Provide a medical license photo"],
    },
    syndicateMembershipPhoto: {
      type: String,
      maxLength: 1000,
      required: [true, "Provide a syndicate membership photo"],
    },
    specialization: {
      type: String,
      required: [true, "Provide your specialization"],
      enum: [
        "General Medicine",
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "Gynecology",
        "Obstetrics",
        "Dermatology",
        "Ophthalmology",
        "Otorhinolaryngology (ENT)",
        "Endocrinology",
        "Hematology",
        "Oncology",
        "Psychiatry",
        "Urology",
        "Gastroenterology",
        "Pulmonology",
        "Rheumatology",
        "Nephrology",
        "Infectious Disease",
        "Plastic Surgery",
        "Thoracic Surgery",
        "Trauma Surgery",
        "Vascular Surgery",
        "Anesthesiology",
        "Radiology",
        "Pathology",
        "Reproductive Medicine",
        "Geriatrics",
        "Sports Medicine",
        "Pain Management",
        "Family Medicine",
        "Emergency Medicine",
        "Medical Genetics",
        "Sleep Medicine",
        "Allergy and Immunology",
        "Clinical Pharmacology",
        "Occupational Medicine",
        "Preventive Medicine",
        "Forensic Medicine",
      ],
    },
    description: {
      type: String,
      maxLength: 400,
    },
    certificatePhoto: {
      type: String,
      required: [true, "provide your graduation certificate"],
    },
    university: {
      type: String,
      required: [true, "provide your university"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: [true, "Email address should be unique"],
    },
    password: {
      type: String,
      required: [true, "Provide a password"],
    },
    dob: {
      type: Date,
      required: [true, "Provide your date of birth"],
      max: new Date(), // Ensures it's not a future date
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Provide your gender"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["NOTVERIFIED", "VERIFIED", "SUSPENDED", "DELETED"],
    },
    role: {
      type: String,
      enum: [
        "Resident Doctor",
        "Specialist",
        "Consultant",
        "Professor",
        "General Practitioner",
        "Lecturer",
        "Assistant Professor",
        "Medical Director",
      ],
      default: "Resident Doctor",
    },
  },
  {
    timestamps: true,
    toJSON: true,
    toObject: true,
  }
);

doctorSchema.index({ phone: 1 });
doctorSchema.index({ specialization: 1 });

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
