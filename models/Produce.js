const mongoose = require("mongoose");

const ProduceSchema = new mongoose.Schema({
  produceName: {
    type: String,
    trim: true,
  },
  produceType: {
    type: String,
    trim: true,
  },
  tonnage: {
    type: Number,
  },
  branch: {
    type: String,
    trim: true,
  },
  salePrice: {
    type: Number,
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
  },
  dealerName: {
    type: String,
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
});

// This prevents model overwriting if it already exists
module.exports = mongoose.models.Produce || mongoose.model("Produce", ProduceSchema);
