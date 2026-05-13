const mongoose = require("mongoose");

/**
 * Inventory Record per admin (school).
 *
 * Stored as a single document keyed by `school` (admin _id) so the entire
 * tab/row tree can be fetched and saved as one atomic blob. This mirrors the
 * UI's localStorage shape exactly, which keeps the frontend simple.
 */
const inventoryRowSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    classId: { type: String, default: "" },
    className: { type: String, default: "" },
    studentId: { type: String, default: "" },
    studentName: { type: String, default: "" },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const inventoryTabSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    rows: { type: [inventoryRowSchema], default: [] },
  },
  { _id: false }
);

const inventoryRecordSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
      unique: true,
      index: true,
    },
    tabs: { type: [inventoryTabSchema], default: [] },
    activeTabId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryRecord", inventoryRecordSchema);
