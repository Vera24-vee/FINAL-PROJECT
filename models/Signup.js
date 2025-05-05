const mongoose = require("mongoose");
const PassportLocalMongoose = require("passport-local-mongoose"); // Import Passport.js plugin

// Define the schema for Signup
const signupSchema = new mongoose.Schema({
  fname: {
    type: String,
    trim: true,
  },
  lname: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,  // Ensure the email is unique
  },
  branch: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
  },
});

// Use PassportLocalMongoose plugin, treating `email` as `username`
signupSchema.plugin(PassportLocalMongoose, { usernameField: "email" });

// Export the model for Signup
module.exports = mongoose.model("Signup", signupSchema);
