const { adminSignin } = require("../controllers/adminContoller");

const adminRouter = require("express").Router();

adminRouter.post("/signin", adminSignin);

module.exports = adminRouter;
