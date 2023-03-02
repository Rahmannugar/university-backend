const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//env links
const port = process.env.PORT;
const url = process.env.MONGODBURL;
const jwt_key = process.env.SECRET_KEY;

//coonecting mongodb
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successful connection!");
  })
  .catch((err) => {
    console.log(`Connection failed: ${err.message}`);
  });

require("./users");
require("./userImages");
require("./UserPayments");
const User = mongoose.model("UserInfo");
const UserImage = mongoose.model("UserImage");
const UserPayment = mongoose.model("UserPayment");
//signup routes
app.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    birthDate,
    gender,
    country,
    zipCode,
    course,
    email,
    phone,
    password,
  } = req.body;

  //hashing the password
  const encryptedPasword = await bcrypt.hash(password, 10);
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.send({ error: "User exists" });
    }
    await User.create({
      firstName,
      lastName,
      birthDate,
      gender,
      country,
      zipCode,
      course,
      email,
      phone,
      password: encryptedPasword,
    });
    res.send({ status: "User created" });
  } catch (error) {
    res.send({ status: "Error" });
  }
});

//login routes
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ error: "User doesn't exist" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        firstname: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      jwt_key,
      { expiresIn: "30m" }
    );

    return res.json({ status: "Logged in successfully", data: token });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//user routes
app.post("/user", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, jwt_key);

    const userEmail = user.email;
    const data = await User.findOne({ email: userEmail });
    res.send({ status: "ok", data: data });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).send({ status: "error", data: "Token expired" });
    } else {
      res.status(500).send({ status: "error", data: error });
    }
  }
});

//payments
app.post("/payments", async (req, res) => {
  const { email, paid } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      res.send({ error: "User doesn't exist" });
    }
    if (existingUser) {
      await UserPayment.create({
        email,
        paid,
      });
      res.send({ status: "Payments successful" });
    }
  } catch (error) {
    res.send({ error: "Error making payments" });
  }
});

//find payments
app.post("/retrievepayments", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await UserPayment.findOne({ email });
    if (!existingUser) {
      res.send({ error: "User doesn't exist" });
    }
    res.send({ data: existingUser });
  } catch (error) {}
});

//upload image
app.post("/upload", async (req, res) => {
  const { email, imageUrl } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      res.send({ error: "User doesn't exist" });
    }
    const oldUser = await UserImage.findOne({ email });
    if (oldUser) {
      const userId = oldUser.id;
      await UserImage.findByIdAndUpdate(
        { _id: userId },
        { imageUrl: imageUrl }
      );
      res.send({ status: "Image updated successfully" });
    }
    if (existingUser && !oldUser) {
      await UserImage.create({
        email,
        imageUrl,
      });
      res.send({ status: "Image uploaded successfully" });
    }
  } catch (error) {
    res.send({ error: "Error uploading image" });
  }
});

//find image
app.post("/image", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await UserImage.findOne({ email });
    if (!existingUser) {
      return res.json({ error: "User doesn't exist" });
    }
    return res.json({ data: existingUser });
  } catch (error) {
    res.send({ error: "Error fetching image" });
  }
});

//forget-password route
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      res.send({ status: "User doesn't exist" });
    }
    if (existingUser) {
      res.send({ status: "Valid student" });
    }
  } catch (error) {
    res.send(error);
  }
});

//posting newly created password
app.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    res.send({ status: "User doesn't exist" });
  }
  try {
    if (existingUser) {
      const encryptedPasword = await bcrypt.hash(password, 10);
      await User.updateOne(
        {
          _id: existingUser.id,
        },
        {
          $set: {
            password: encryptedPasword,
          },
        }
      );
      res.send({ status: "Password updated" });
    }
  } catch (error) {
    res.send("Failed to update password");
  }
});

//Getting port data
app.get("/", (req, res) => {
  res.send("University-backend");
});

//Port listener
app.listen(port, () => {
  console.log(`Server started from ${port}`);
});
