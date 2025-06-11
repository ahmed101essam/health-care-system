const fs = require("fs/promises");
const dotenv = require("dotenv");
dotenv.config({});
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Location = require("../models/Location");

(async () => {
  await mongoose.connect(process.env.DATABASE_URL).then(() => {
    console.log("DB connected successfully");
  });

  const importAdmin = async () => {
    let admins = await fs.readFile(
      "/home/ironman/Desktop/graduation project backend/data/locations.json"
    );
    admins = await JSON.parse(admins);
    await Location.create(admins);
  };

  if (process.argv[2] === "--import") {
    await importAdmin();
    console.log("Admins imported successfully");
  }
})();
