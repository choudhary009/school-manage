const mongoose = require("mongoose");
const ExpenseRecord = require("../models/expenseRecordSchema");

function normaliseTabs(tabs) {
  if (!Array.isArray(tabs)) return [];
  return tabs
    .filter((t) => t && typeof t === "object")
    .map((t) => ({
      id: String(t.id || `tab_${Date.now()}`),
      name: String(t.name || "Untitled").trim() || "Untitled",
      rows: Array.isArray(t.rows)
        ? t.rows
            .filter((r) => r && typeof r === "object")
            .map((r) => ({
              id: String(r.id || `row_${Date.now()}`),
              title: String(r.title || "").trim(),
              amount: Math.max(0, Number(r.amount) || 0),
            }))
        : [],
    }));
}

const getExpenseRecord = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ ok: false, message: "Invalid admin id" });
    }
    const doc = await ExpenseRecord.findOne({ school: adminId });
    if (!doc) {
      return res.json({ ok: true, tabs: [], activeTabId: "" });
    }
    return res.json({
      ok: true,
      tabs: doc.tabs,
      activeTabId: doc.activeTabId || (doc.tabs[0]?.id ?? ""),
    });
  } catch (err) {
    console.error("getExpenseRecord error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

const upsertExpenseRecord = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ ok: false, message: "Invalid admin id" });
    }
    const tabs = normaliseTabs(req.body?.tabs);
    const activeTabId = String(req.body?.activeTabId || tabs[0]?.id || "");

    const updated = await ExpenseRecord.findOneAndUpdate(
      { school: adminId },
      { $set: { tabs, activeTabId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({
      ok: true,
      tabs: updated.tabs,
      activeTabId: updated.activeTabId,
    });
  } catch (err) {
    console.error("upsertExpenseRecord error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = { getExpenseRecord, upsertExpenseRecord };
