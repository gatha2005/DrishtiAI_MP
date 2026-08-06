require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
console.log("User =", User);
console.log("Type =", typeof User);

async function createAdmin() {
  try {

    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await User.findOne({
      username: "admin"
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword =
      await bcrypt.hash("admin123", 10);

    const admin = new User({
      username: "admin",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("Admin created successfully");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createAdmin();