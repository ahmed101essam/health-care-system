const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, "Please provide the location id of the appointment."],
      ref: "Location",
    },
    doctor: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, "Please provide the doctor id."],
      ref: "Doctor",
    },
    patient: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, "Please provide the patient id."],
      ref: "Patient",
    },
    slot: {
      type: {
        date: { type: Date, required: true },
        day: {
          type: String,
          enum: [
            "Saturday",
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          required: true,
        },
        from: { type: String, required: true },
        to: { type: String, required: true },
        number: { type: Number, required: true },
      },
      required: [true, "Slot is required"],
    },
    status: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "COMPLETED", "CANCELED"],
    },
    notes: {
      type: [String],
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
