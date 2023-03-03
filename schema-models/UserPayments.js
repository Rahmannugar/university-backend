const mongoose = require("mongoose");

const UserPaymentSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    paid: Boolean,
  },
  {
    collection: "UserPayment",
  }
);

mongoose.model("UserPayment", UserPaymentSchema);
