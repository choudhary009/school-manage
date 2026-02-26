const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sclass",
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  tuitionFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },
  labFee: { type: Number, default: 0 },
  libraryFee: { type: Number, default: 0 },
  sportsFees: { type: Number, default: 0 },
  computerFee: { type: Number, default: 0 },
  examinationFee: { type: Number, default: 0 },
  admissionFee: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  hostelFee: { type: Number, default: 0 },
  stationaryFee: { type: Number, default: 0 },
  uniformFee: { type: Number, default: 0 },
  miscFee: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
