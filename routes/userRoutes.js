const {
  patientSignup,
  resendVerification,
  patientLogin,
  verifyEmail,
  forgetPassword,
  changePassword,
} = require("../controllers/authController");
const { uploadImage } = require("../utils/imageCloud");
const upload = require("../utils/upload");

const userRouter = require("express").Router();

userRouter.post("/signup", upload.single("photo"), uploadImage, patientSignup);
userRouter.post("/login", patientLogin);
userRouter.post("/resendVerification", resendVerification);
userRouter.post("/verifyEmail", verifyEmail);
userRouter.patch("/forgetPassword", forgetPassword);
userRouter.post("/newPassword", changePassword);

module.exports = userRouter;
