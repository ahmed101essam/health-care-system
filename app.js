const express = require("express");
const userRouter = require("./routes/userRoutes");
const errorController = require("./controllers/errorController");
const adminRouter = require("./routes/adminRoutes");
const doctorRouter = require("./routes/doctorRoutes");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/admins", adminRouter);

app.use(errorController);

module.exports = app;
