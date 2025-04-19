const {
  protect,
  restrictTo,
  doctorSignup,
  doctorLogin,
} = require("../controllers/authController");
const { me, getAllDoctors } = require("../controllers/doctorController");
const Doctor = require("../models/Doctor");
const { uploadDoctorFiles } = require("../utils/imageCloud");
const upload = require("../utils/upload");

const doctorRouter = require("express").Router();

doctorRouter.route("/").get(getAllDoctors);

doctorRouter.route("/me").get(protect(Doctor), restrictTo("DOCTOR"), me);
doctorRouter.post(
  "/signup",
  upload.fields([
    { name: "nationalIdPhoto", maxCount: 1 },
    { name: "certificatePhoto", maxCount: 1 },
    { name: "syndicateMembershipPhoto", maxCount: 1 },
    { name: "medicalLicensePhoto", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  uploadDoctorFiles,
  doctorSignup
);
doctorRouter.post("/login", doctorLogin);

module.exports = doctorRouter;
