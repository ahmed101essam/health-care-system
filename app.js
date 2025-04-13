const express = require("express");
const userRouter = require("./routes/userRoutes");
const errorController = require("./controllers/errorController");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);

app.use(errorController);

module.exports = app;
