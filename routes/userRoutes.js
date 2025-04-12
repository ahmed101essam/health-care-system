const { patientSignup } = require("../controllers/authController");
const { uploadImage } = require("../utils/imageCloud");
const upload = require("../utils/upload");

const userRouter = require("express").Router();

userRouter.post("/signup", upload.single("photo"), uploadImage, patientSignup);

module.exports = userRouter;
