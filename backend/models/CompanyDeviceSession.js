const mongoose = require('mongoose');

const companyDeviceSessionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },
    ip: String,
    userAgent: String,
    os: String,
    appVersion: String
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'CompanyDeviceSession',
  companyDeviceSessionSchema
);

