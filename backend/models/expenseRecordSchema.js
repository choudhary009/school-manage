const mongoose = require("mongoose");

/**
 * Expense Record per admin (school) — same tab/row shape as Inventory Record
 * but stored in a separate collection so data never mixes.
 */
const expenseRowSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    // Expense is a single-amount entry; class/student/purchase/sale columns
    // from the Inventory model do not apply here.
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const expenseTabSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    rows: { type: [expenseRowSchema], default: [] },
  },
  { _id: false }
);

const expenseRecordSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
      unique: true,
      index: true,
    },
    tabs: { type: [expenseTabSchema], default: [] },
    activeTabId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenseRecord", expenseRecordSchema);
