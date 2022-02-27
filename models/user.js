const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    lastname: String,
    firstname: String,
    phone: String,
    avatar: Object,
    description: String,
  },
  token: String,
  hash: String,
  salt: String,
  creationDate: { type: Date, default: Date.now },
});

module.exports = User;
