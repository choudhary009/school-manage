const express = require('express');
const router = express.Router();
const LedgerParty = require('../models/LedgerParty');
const LedgerTransaction = require('../models/LedgerTransaction');
const { verifyCompany } = require('../middleware/auth');
const ensureMongoConnection = require('../middleware/mongoConnection');
const Sale = require('../models/Sale');
const Bill = require('../models/Bill');
const Recovery = require('../models/Recovery');

// Create ledger party (customer / supplier)
router.post('/parties', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { name, nameUrdu, type, phone, address, openingBalance, balanceType, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Calculate balance: receivable = positive, payable = negative
    const balance = openingBalance || 0;
    const finalBalance = balanceType === 'payable' ? -Math.abs(balance) : Math.abs(balance);

    const party = new LedgerParty({
      companyId,
      name,
      nameUrdu: nameUrdu || '',
      type,
      phone: phone || '',
      address: address || '',
      openingBalance: finalBalance,
      balanceType: balanceType || 'receivable',
      currentBalance: finalBalance,
      notes: notes || ''
    });

    await party.save();

    res.json({ message: 'Ledger party created successfully', party });
  } catch (error) {
    console.error('Create ledger party error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all parties for company (optionally filtered by type, with optional pagination)
router.get('/parties', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { type, page, limit = 100 } = req.query;

    const query = { companyId };
    if (type && ['customer', 'supplier'].includes(type)) {
      query.type = type;
    }

    const total = await LedgerParty.countDocuments(query);
    const usePagination = page !== undefined;
    const limitNum = Math.min(parseInt(limit, 10) || 100, 2000);
    const skip = usePagination ? (Math.max(1, parseInt(page, 10) || 1) - 1) * limitNum : 0;

    const parties = await LedgerParty.find(query)
      .sort({ name: 1 })
      .skip(usePagination ? skip : 0)
      .limit(usePagination ? limitNum : Math.min(total, 2000))
      .lean();

    res.json({
      parties,
      ...(usePagination ? { totalPages: Math.ceil(total / limitNum), currentPage: parseInt(page, 10) || 1, total } : {})
    });
  } catch (error) {
    console.error('Get ledger parties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update party
router.put('/parties/:partyId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { partyId } = req.params;
    const { name, nameUrdu, type, phone, address, openingBalance, balanceType, notes } = req.body;

    const party = await LedgerParty.findOne({ _id: partyId, companyId });
    if (!party) {
      return res.status(404).json({ message: 'Ledger party not found' });
    }

    if (name !== undefined) party.name = name;
    if (nameUrdu !== undefined) party.nameUrdu = nameUrdu;
    if (type !== undefined && ['customer', 'supplier'].includes(type)) party.type = type;
    if (phone !== undefined) party.phone = phone;
    if (address !== undefined) party.address = address;
    if (balanceType !== undefined && ['receivable', 'payable'].includes(balanceType)) party.balanceType = balanceType;
    if (notes !== undefined) party.notes = notes;

    // If opening balance or balanceType changed, recalculate
    if (openingBalance !== undefined && typeof openingBalance === 'number') {
      const balance = openingBalance;
      const finalBalance = (balanceType || party.balanceType) === 'payable' ? -Math.abs(balance) : Math.abs(balance);
      const diff = finalBalance - (party.openingBalance || 0);
      party.openingBalance = finalBalance;
      party.currentBalance = (party.currentBalance || 0) + diff;
    } else if (balanceType !== undefined && ['receivable', 'payable'].includes(balanceType)) {
      // If only balanceType changed, recalculate opening balance
      const balance = Math.abs(party.openingBalance || 0);
      const finalBalance = balanceType === 'payable' ? -balance : balance;
      const diff = finalBalance - (party.openingBalance || 0);
      party.openingBalance = finalBalance;
      party.currentBalance = (party.currentBalance || 0) + diff;
    }

    await party.save();

    res.json({ message: 'Ledger party updated successfully', party });
  } catch (error) {
    console.error('Update ledger party error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete party (and its transactions)
router.delete('/parties/:partyId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { partyId } = req.params;

    const party = await LedgerParty.findOneAndDelete({ _id: partyId, companyId });
    if (!party) {
      return res.status(404).json({ message: 'Ledger party not found' });
    }

    await LedgerTransaction.deleteMany({ partyId: party._id, companyId });

    res.json({ message: 'Ledger party and its transactions deleted successfully' });
  } catch (error) {
    console.error('Delete ledger party error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get transactions for a party (with pagination)
router.get('/parties/:partyId/transactions', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { partyId } = req.params;
    const { page, limit = 50 } = req.query;

    const party = await LedgerParty.findOne({ _id: partyId, companyId });
    if (!party) {
      return res.status(404).json({ message: 'Ledger party not found' });
    }

    const total = await LedgerTransaction.countDocuments({ companyId, partyId });
    const usePagination = page !== undefined;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = usePagination ? (Math.max(1, parseInt(page, 10) || 1) - 1) * limitNum : 0;

    const transactions = await LedgerTransaction.find({ companyId, partyId })
      .populate('saleId', 'serialNumber')
      .populate('billId', 'serialNumber expenses')
      .sort({ date: 1, createdAt: 1 })
      .skip(usePagination ? skip : 0)
      .limit(usePagination ? limitNum : Math.min(total, 2000))
      .lean();

    res.json({
      party,
      transactions,
      ...(usePagination ? { totalPages: Math.ceil(total / limitNum), currentPage: parseInt(page, 10) || 1, total } : {})
    });
  } catch (error) {
    console.error('Get ledger transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const { recalcPartyBalances } = require('../utils/ledgerUtils');

// Create transaction
router.post('/parties/:partyId/transactions', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { partyId } = req.params;
    const { date, description, type, amount, billId } = req.body;

    if (!type || !['debit', 'credit'].includes(type) || typeof amount !== 'number') {
      return res.status(400).json({ message: 'Type (debit/credit) and numeric amount are required' });
    }

    const party = await LedgerParty.findOne({ _id: partyId, companyId });
    if (!party) {
      return res.status(404).json({ message: 'Ledger party not found' });
    }

    const tx = new LedgerTransaction({
      companyId,
      partyId,
      billId: billId || null,
      date: date ? new Date(date) : new Date(),
      description: description || '',
      type,
      amount
    });

    await tx.save();
    await recalcPartyBalances(companyId, partyId);

    res.json({ message: 'Transaction created successfully', transaction: tx });
  } catch (error) {
    console.error('Create ledger transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update transaction
router.put('/transactions/:transactionId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { transactionId } = req.params;
    const { date, description, type, amount } = req.body;

    const tx = await LedgerTransaction.findOne({ _id: transactionId, companyId });
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (date !== undefined) tx.date = new Date(date);
    if (description !== undefined) tx.description = description;
    if (type !== undefined && ['debit', 'credit'].includes(type)) tx.type = type;
    if (amount !== undefined && typeof amount === 'number') tx.amount = amount;

    await tx.save();
    await recalcPartyBalances(companyId, tx.partyId);

    res.json({ message: 'Transaction updated successfully', transaction: tx });
  } catch (error) {
    console.error('Update ledger transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete transaction
router.delete('/transactions/:transactionId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { transactionId } = req.params;

    const tx = await LedgerTransaction.findOneAndDelete({ _id: transactionId, companyId });
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await recalcPartyBalances(companyId, tx.partyId);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete ledger transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all general sales for company
// Bulk endpoint for receipt generation - extremely optimized for the 'Print Selected' feature
router.post('/bulk-receipt-data', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { partyIds } = req.body;

    if (!Array.isArray(partyIds) || partyIds.length === 0) {
      return res.status(400).json({ message: 'partyIds array is required' });
    }

    // Fetch parties
    const parties = await LedgerParty.find({ _id: { $in: partyIds }, companyId }).lean();

    // Fetch all transactions for these parties
    const allTransactions = await LedgerTransaction.find({
      companyId,
      partyId: { $in: partyIds }
    })
      .populate('saleId', 'serialNumber')
      .populate('billId', 'serialNumber expenses')
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // Fetch shared data (Sales, Bills, Recoveries) based on transactions
    const saleIds = [...new Set(allTransactions.filter(tx => tx.saleId).map(tx => tx.saleId._id || tx.saleId))];
    const billIds = [...new Set(allTransactions.filter(tx => tx.billId).map(tx => tx.billId._id || tx.billId))];
    const recoveryIds = [...new Set(allTransactions.filter(tx => tx.recoveryId).map(tx => tx.recoveryId))];

    const [sales, bills, recoveries] = await Promise.all([
      Sale.find({ _id: { $in: saleIds }, companyId }).lean(),
      Bill.find({ _id: { $in: billIds }, companyId }).lean(),
      Recovery.find({ _id: { $in: recoveryIds }, companyId }).lean()
    ]);

    // Fetch all sales for these customers to calculate "daily sales" context
    const partyNames = parties.map(p => p.name);
    const partyNamesUrdu = parties.map(p => p.nameUrdu).filter(Boolean);

    const customerSales = await Sale.find({
      companyId,
      $or: [
        { customerPartyId: { $in: partyIds } },
        { sellerName: { $in: partyNames } },
        { sellerNameUrdu: { $in: partyNamesUrdu } }
      ]
    }).sort({ date: -1 }).lean();

    // Group transactions by partyId
    const transactionsByParty = {};
    allTransactions.forEach(tx => {
      if (!transactionsByParty[tx.partyId]) transactionsByParty[tx.partyId] = [];
      transactionsByParty[tx.partyId].push(tx);
    });

    res.json({
      parties,
      transactionsMap: transactionsByParty,
      sales,
      bills,
      recoveries,
      customerSales
    });
  } catch (error) {
    console.error('Bulk receipt data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/general-sales', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { page, limit = 50 } = req.query;

    const query = {
      companyId,
      description: { $in: ['جنرل سیل', 'General Sale'] },
      type: 'debit'
    };

    const total = await LedgerTransaction.countDocuments(query);
    const usePagination = page !== undefined;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 2000);
    const skip = usePagination ? (Math.max(1, parseInt(page, 10) || 1) - 1) * limitNum : 0;

    const transactions = await LedgerTransaction.find(query)
      .populate('partyId', 'name nameUrdu type')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(usePagination ? limitNum : Math.min(total, 2000))
      .lean();

    res.json({
      generalSales: transactions,
      ...(usePagination ? { totalPages: Math.ceil(total / limitNum), currentPage: parseInt(page, 10) || 1, total } : {})
    });
  } catch (error) {
    console.error('Get general sales error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


