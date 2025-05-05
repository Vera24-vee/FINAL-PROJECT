const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema({
  buyerName: {
    type: String,
    trim: true,
  },
  nin: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
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
  amountDue: {
    type: Number,
  },
  unitPrice: {
    type: Number,
  },
  agentName: {
    type: String,
    trim: true,
  },
  branch: {
    type: String,
    trim: true,
  },
  dueDate: {
    type: Date,
  },
  dispatchDate: {
    type: Date,
  },
  dispatchTime: {
    type: String,
    trim: true,
  },
});

CreditSchema.index({ produceName: 1, branch: 1 });

module.exports = mongoose.model("credit", CreditSchema);
