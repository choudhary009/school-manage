const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  certificateNo: {
    type: String,
    required: true,
  },
  certificateType: {
    type: String,
    enum: ["School Leaving", "Character", "Teacher Experience"],
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teacher",
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  dateIssued: {
    type: Date,
    default: Date.now,
  },
  leavingDate: Date,
  conduct: String,
  reason: String,
  extraDetails: {
    type: Map,
    of: String
  }
}, { timestamps: true });

module.exports = mongoose.model("certificate", certificateSchema);
