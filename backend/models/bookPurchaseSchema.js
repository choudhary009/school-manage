const mongoose = require("mongoose");

const bookPurchaseSchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("bookPurchase", bookPurchaseSchema);
