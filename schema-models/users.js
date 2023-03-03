const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    birthDate: Date,
    gender: String,
    country: String,
    zipCode: String,
    course: String,
    phone: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
  },
  {
    collection: "UserInfo",
  }
);

mongoose.model("UserInfo", UserSchema);
