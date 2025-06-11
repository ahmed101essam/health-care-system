const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Location = require("../models/Location");
const catchAsync = require("../utils/catchAsync");

exports.getNearestLocationsByDoctorFilter = catchAsync(
  async (req, res, next) => {
    const { specialization, role, lng, lat } = req.body;
    if (!specialization) {
      return next(
        new AppError("Please provide a specialization to filter doctors.", 400)
      );
    }
    // Step 1: Find matching doctors
    let doctors = Doctor.find({ specialization }, "_id");
    if (role) {
      doctors = doctors.find({ role });
    }
    doctors = await doctors.select("_id");

    const doctorIds = doctors.map((doc) => doc._id);

    // Step 2: Find their locations, sorted by distance
    let locations;
    if (lng && lat) {
      locations = await Location.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
            distanceField: "distance",
            spherical: true,
            query: { doctor: { $in: doctorIds } },
          },
        },
      ]);
    } else {
      locations = await Location.find({
        doctor: { $in: doctorIds },
      });
    }

    res.status(200).json({
      count: locations.length,
      data: locations,
    });
  }
);

function getDateNumber(day) {
  // Convert day string to number (0-6)
  switch (day.toLowerCase()) {
    case "sunday":
      return 0;
    case "monday":
      return 1;
    case "tuesday":
      return 2;
    case "wednesday":
      return 3;
    case "thursday":
      return 4;
    case "friday":
      return 5;
    case "saturday":
      return 6;
    default:
      throw new Error("Invalid day provided");
  }
}

exports.doctorNeareastSlots = catchAsync(async (req, res, next) => {
  const { doctorId, locationId } = req.body;
  const options = {
    weekday: "short", // "Tue"
    day: "2-digit", // "17"
    month: "2-digit", // "12"
    year: "numeric", // "2022"
  };
  const day = new Date().getDay(); // Get the current day (0-6, where 0 is Sunday)
  const locations = await Location.find({
    doctor: doctorId,
    _id: locationId,
    slots: {
      $elemMatch: {
        booked: false, // Only get unbooked slots
      },
    },
  }).select("slots avgVisitTime calculatedSlots");

  if (!locations || locations.length === 0) {
    return res.status(404).json({
      message: "No available slots found for this doctor at this location.",
    });
  }

  let availableSlots = locations[0].calculatedSlots.map((slot) => {
    return {
      day: slot.day,
      from: slot.from,
      to: slot.to,
      number: slot.number,
      date: new Date(
        new Date().setDate(
          new Date().getDate() + ((getDateNumber(slot.day) - day + 7) % 7)
        )
      ).toLocaleDateString("en-US", options),
    };
  });

  availableSlots = availableSlots.filter(async (slot) => {
    if (
      await Appointment.findOne({
        doctor: doctorId,
        location: locationId,
        slot: {
          date: new Date(slot.date),
          day: slot.day,
          from: slot.from,
        },
      })
    ) {
      return false; // Slot is already booked
    }
    return true; // Slot is available
  });

  res.json({
    slots: availableSlots,
  });
});

exports.bookAppointement = catchAsync(async (req, res, next) => {
  const { doctorId, locationId, slot } = req.body;

  // Validate input
  if (!doctorId || !locationId || !slot) {
    return res.status(400).json({
      message: "Doctor ID, Location ID, and Slot are required.",
    });
  }

  // Find the location and check if the slot is available
  const isBooked = await Appointment.findOne({
    doctor: doctorId,
    location: locationId,
    slot: {
      date: new Date(slot.date),
      day: slot.day,
      from: slot.time,
    },
  });

  if (!isBooked) {
    return res.status(404).json({
      message: "No available slot found for this doctor at this location.",
    });
  }

  // Book the appointment (update the slot)
  await Appointment.create({
    doctor: doctorId,
    location: locationId,
    patient: req.user.id, // Assuming req.user.id is the ID of the patient
    slot: {
      date: new Date(slot.date),
      day: slot.day,
      from: slot.time,
      to: new Date(
        new Date(slot.date).setHours(
          new Date(slot.date).getHours() + 1 // Assuming each appointment lasts 1 hour
        )
      ).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      number: 1, // Assuming a single slot for simplicity
    },
    status: "PENDING",
  });

  res.status(200).json({
    message: "Appointment booked successfully.",
  });
});
