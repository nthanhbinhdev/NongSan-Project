// src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, required: true, unique: true }, // ID mapping với Firebase
  email: { type: String, required: true, unique: true },
  fullName: { type: String },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: "customer" }, // 'admin' hoặc 'customer'
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
