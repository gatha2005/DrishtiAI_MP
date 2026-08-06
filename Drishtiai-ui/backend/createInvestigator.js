require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createInvestigator() {
  try {

    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({
      username: "investigator"
    });

    if (existingUser) {
      console.log("Investigator already exists");
      process.exit();
    }

    const hashedPassword =
      await bcrypt.hash("invest123", 10);

    const investigator = new User({
      username: "investigator",
      password: hashedPassword,
      role: "investigator"
    });

    await investigator.save();

    console.log("Investigator created successfully");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createInvestigator();