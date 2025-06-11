const express = require("express");
const aiRouter = express.Router();
const aiController = require("../controllers/aiController");

// GET /api/ai/nearest-locations?specialization=Cardiology&role=Consultant&lng=31&lat=30
aiRouter.get(
  "/nearest-locations",
  aiController.getNearestLocationsByDoctorFilter
);

aiRouter.get("/available-appointments", aiController.doctorNeareastSlots);

aiRouter.post("book-appointment", aiController.bookAppointement);

module.exports = aiRouter;
