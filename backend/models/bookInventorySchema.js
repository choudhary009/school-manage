const mongoose = require("mongoose");

const bookInventorySchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    totalPurchased: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    availableStock: {
      type: Number,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
  },
  { timestamps: true }
);

bookInventorySchema.index({ bookName: 1, school: 1 }, { unique: true });

module.exports = mongoose.model("bookInventory", bookInventorySchema);
