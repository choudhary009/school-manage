const mongoose = require('mongoose');

const dailyKharchaSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  tafseel: {
    type: String,
    default: ''
  },
  tafseelUrdu: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

dailyKharchaSchema.index({ companyId: 1 });
dailyKharchaSchema.index({ date: -1 });

module.exports = mongoose.model('DailyKharcha', dailyKharchaSchema);

