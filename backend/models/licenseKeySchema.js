const mongoose = require("mongoose");

const licenseKeySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    description: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    deviceName: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    location: {
      type: String,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LicenseKey", licenseKeySchema);

