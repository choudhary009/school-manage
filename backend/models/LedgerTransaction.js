const mongoose = require('mongoose');

const ledgerTransactionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerParty',
    required: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    default: null
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null
  },
  recoveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recovery',
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

ledgerTransactionSchema.index({ companyId: 1 });
ledgerTransactionSchema.index({ partyId: 1 });
ledgerTransactionSchema.index({ date: -1, createdAt: -1 });
ledgerTransactionSchema.index({ partyId: 1, date: 1 }); // Optimized for party ledger view

module.exports = mongoose.model('LedgerTransaction', ledgerTransactionSchema);


