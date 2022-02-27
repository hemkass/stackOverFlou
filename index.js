require("dotenv").config();

const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(
  formidable({
    multiples: true,
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome on my app" });
});

const userRoutes = require("./routes/user");
app.use(userRoutes);

/* const topicRoutes = require("./routes/topic");
app.use(topicRoutes);

const messageRoutes = require("./routes/message");
app.use(messageRoutes); */

app.all("*", (req, res) => {
  res.json("All routes");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
