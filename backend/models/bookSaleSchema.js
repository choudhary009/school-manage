const mongoose = require("mongoose");

const bookSaleSchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentRollNum: {
      type: String,
    },
    studentClass: {
      type: String,
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

module.exports = mongoose.model("bookSale", bookSaleSchema);
