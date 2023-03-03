const mongoose = require("mongoose");

const UserImageSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    imageUrl: String,
  },
  {
    collection: "UserImage",
  }
);

mongoose.model("UserImage", UserImageSchema);
