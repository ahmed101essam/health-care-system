const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    fees: {
      type: Number,
      required: [true, "Provide the fees of this location"],
    },
    governorate: {
      type: String,
      required: [true, "Provide the location governorate."],
    },
    points: {
      type: Number,
    },
    area: {
      type: String,
      required: [true, "Provide the location area."],
    },
    street: {
      type: String,
      required: [true, "Provide the location street"],
    },
    buildingNumber: {
      type: String,
    },
    type: {
      type: String,
      default: "Clinic",
    },
    avgVisitTime: {
      type: Number,
      default: 30,
      required: [true, "Provide the average visit time."],
    },
    slots: [
      {
        day: {
          type: String,
          required: [true, "Provide the day."],
        },
        from: {
          type: String,
          required: [true, "Provide the starting time."],
        },
        to: {
          type: String,
          required: [true, "Provide the finishing time."],
        },
        booked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    locPoint: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    doctor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Doctor", // assuming "Doctor" is the model name for your doctor schema
      required: [true, "Doctor is required"],
    },
    status: {
      type: String,
      default: "UNVERIFIED",
      enum: ["UNVERIFIED", "VERIFIED", "SUSPENDED", "DELETED"],
    },
    taxIdNumber: {
      type: String,
      required: [true, "Provide the tax ID number."],
    },
    commercialRegistrationNumber: {
      type: String,
      required: [true, "Provide the commercial registration number."],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

locationSchema.index({ locPoint: "2dsphere" });
locationSchema.index({ governorate: 1, area: 1 });

function timeStrToMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

// Helper to convert minutes to HH:mm
function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Virtual slots with calculated times
locationSchema.virtual("calculatedSlots").get(function () {
  if (!this.slots || !this.avgVisitTime) return [];

  const allSlots = [];

  this.slots.forEach((slotObj) => {
    const startMins = timeStrToMinutes(slotObj.from);
    const endMins = timeStrToMinutes(slotObj.to);
    const totalSlots = Math.floor((endMins - startMins) / this.avgVisitTime);

    for (let i = 0; i < totalSlots; i++) {
      const slotStart = startMins + i * this.avgVisitTime;
      const slotEnd = slotStart + this.avgVisitTime;

      allSlots.push({
        day: slotObj.day,
        from: minutesToTimeStr(slotStart),
        to: minutesToTimeStr(slotEnd),
        number: i + 1,
      });
    }
  });

  return allSlots;
});

module.exports = mongoose.model("Location", locationSchema);
