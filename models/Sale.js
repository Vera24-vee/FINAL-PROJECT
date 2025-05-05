const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
    productName: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    unitPrice: {
        type: Number,
    },
    tonnage: {
        type: Number,
    },
    total: {
        type: Number,
    },
    buyerName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    saleDate: {
        type: Date,
    },
    saleTime: {
        type: String,
        trim: true,
    },
    paymentMode: {
        type: String,
        trim: true,
    },
    branch: {
        type: String,
        trim: true,
        lowercase: true,
    },
    agentName: {
        type: String,
        trim: true,
    }
});

module.exports = mongoose.models.Sale || mongoose.model("Sale", salesSchema);
