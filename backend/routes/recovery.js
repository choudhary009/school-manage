const express = require('express');
const router = express.Router();
const Recovery = require('../models/Recovery');
const Bank = require('../models/Bank');
const LedgerParty = require('../models/LedgerParty');
const LedgerTransaction = require('../models/LedgerTransaction');
const BankTransaction = require('../models/BankTransaction');
const { verifyCompany } = require('../middleware/auth');
const { recalcPartyBalances } = require('../utils/ledgerUtils');
const { recalcBankBalances } = require('../utils/bankUtils');

// Company: Get all recoveries (with filtering, pagination)
router.get('/company/all', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { search, dateFrom, dateTo, page, limit = 50 } = req.query;

    const query = { companyId };

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDay = new Date(dateTo);
        endDay.setHours(23, 59, 59, 999);
        query.date.$lte = endDay;
      }
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerNameUrdu: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { customerVehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Recovery.countDocuments(query);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 10000);
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    const recoveries = await Recovery.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      recoveries,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get recoveries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Get single recovery
router.get('/company/:recoveryId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const recovery = await Recovery.findOne({ _id: req.params.recoveryId, companyId });

    if (!recovery) {
      return res.status(404).json({ message: 'Recovery not found' });
    }

    // If customerPartyId is not set, try to find it from ledger transaction (backward compatibility)
    if (!recovery.customerPartyId) {
      try {
        const ledgerTx = await LedgerTransaction.findOne({
          companyId,
          recoveryId: recovery._id
        });
        if (ledgerTx && ledgerTx.partyId) {
          recovery.customerPartyId = ledgerTx.partyId;
          await recovery.save();
        }
      } catch (error) {
        console.error('Error finding customerPartyId from ledger:', error);
      }
    }

    // Fetch company data
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);

    res.json({ recovery, company });
  } catch (error) {
    console.error('Get recovery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Create new recovery
router.post('/company/create', verifyCompany, async (req, res) => {
  try {
    const {
      serialNumber,
      customerName,
      customerNameUrdu,
      customerVehicleNumber,
      customerPhone,
      customerPartyId,
      recoveryAmount,
      paymentMethod,
      bankId,
      description,
      descriptionUrdu,
      date
    } = req.body;
    const companyId = req.user.id;

    // Auto-increment serial number if not provided or empty
    let finalSerialNumber = serialNumber?.toString().trim() || '';
    if (!finalSerialNumber) {
      // Find all recoveries for this company and get the highest serial number
      const allRecoveries = await Recovery.find({ companyId }).select('serialNumber');
      let maxSerial = 0;

      allRecoveries.forEach(recovery => {
        const sn = recovery.serialNumber?.toString().trim() || '';
        const num = parseInt(sn, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      });

      finalSerialNumber = String(maxSerial + 1);
    }

    const recovery = new Recovery({
      companyId,
      serialNumber: finalSerialNumber,
      customerName: customerName || '',
      customerNameUrdu: customerNameUrdu || '',
      customerVehicleNumber: customerVehicleNumber || '',
      customerPhone: customerPhone || '',
      customerPartyId: customerPartyId || null,
      recoveryAmount: recoveryAmount || 0,
      paymentMethod: paymentMethod || '',
      description: description || '',
      descriptionUrdu: descriptionUrdu || '',
      date: date ? new Date(date) : new Date()
    });

    await recovery.save();

    // Get company to check language preference (once at the start)
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    const isUrdu = company?.language === 'ur';

    // If payment method is a bank, create bank transaction
    if (paymentMethod && recoveryAmount > 0) {
      try {
        let bank = null;

        // First try to find bank by bankId if provided (only admin-managed banks)
        if (bankId) {
          bank = await Bank.findOne({
            _id: bankId,
            companyId,
            isAdminManaged: true,
            isActive: true
          });
        }

        // If not found, try to find by payment method name (only admin-managed banks)
        if (!bank) {
          bank = await Bank.findOne({
            companyId,
            isAdminManaged: true,
            $or: [
              { bankName: paymentMethod },
              { bankNameUrdu: paymentMethod }
            ],
            isActive: true
          });
        }

        if (bank) {
          // Calculate current balance
          const allTransactions = await BankTransaction.find({ bankId: bank._id })
            .sort({ date: 1, createdAt: 1 });

          let currentBalance = bank.openingBalance || 0;
          allTransactions.forEach(tx => {
            if (tx.type === 'deposit') {
              currentBalance += tx.amount;
            } else {
              currentBalance -= tx.amount;
            }
          });

          // Create deposit transaction
          const bankTransaction = new BankTransaction({
            companyId,
            bankId: bank._id,
            recoveryId: recovery._id,
            date: date ? new Date(date) : new Date(),
            type: 'deposit',
            amount: recoveryAmount,
            paymentMethod: paymentMethod,
            description: isUrdu
              ? `ریکوری #${finalSerialNumber} - ${customerNameUrdu || customerName}`
              : `Recovery #${finalSerialNumber} - ${customerNameUrdu || customerName}`,
            descriptionUrdu: `ریکوری #${finalSerialNumber} - ${customerNameUrdu || customerName}`,
            balanceAfter: currentBalance + recoveryAmount
          });

          await bankTransaction.save();
        }
      } catch (bankError) {
        console.error('Create bank transaction error:', bankError);
        // Don't fail recovery creation if bank transaction fails
      }
    }

    // Create ledger transaction for recovery if customerPartyId is provided
    if (customerPartyId && recoveryAmount > 0) {
      try {
        let party = null;

        // First try to find by customerPartyId
        if (customerPartyId) {
          party = await LedgerParty.findOne({ _id: customerPartyId, companyId });
        }

        // If not found by ID, try to find by customer name
        if (!party && customerName) {
          party = await LedgerParty.findOne({
            companyId,
            $or: [
              { name: customerName },
              { nameUrdu: customerName },
              { name: customerNameUrdu },
              { nameUrdu: customerNameUrdu }
            ]
          });
        }

        if (party) {
          // Get company to check language preference
          const Company = require('../models/Company');
          const company = await Company.findById(companyId);
          const isUrdu = company?.language === 'ur';

          const ledgerTx = new LedgerTransaction({
            companyId,
            partyId: party._id,
            billId: null,
            recoveryId: recovery._id,
            date: date ? new Date(date) : new Date(),
            description: isUrdu
              ? `ریکوری #${finalSerialNumber} - ${customerNameUrdu || customerName}`
              : `Recovery #${finalSerialNumber} - ${customerNameUrdu || customerName}`,
            type: party.type === 'supplier' ? 'debit' : 'credit', // Supplier: debit, Customer: credit
            amount: recoveryAmount
          });
          await ledgerTx.save();

          // Recalculate party balance
          await recalcPartyBalances(companyId, party._id);
        }
      } catch (ledgerError) {
        console.error('Create recovery ledger transaction error:', ledgerError);
        // Don't fail recovery creation if ledger transaction fails
      }
    }

    res.json({
      message: 'Recovery created successfully',
      recovery
    });
  } catch (error) {
    console.error('Create recovery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Update recovery
router.put('/company/:recoveryId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    // Get company to check language preference
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    const isUrdu = company?.language === 'ur';

    const recovery = await Recovery.findOne({ _id: req.params.recoveryId, companyId });

    if (!recovery) {
      return res.status(404).json({ message: 'Recovery not found' });
    }

    const {
      customerName,
      customerNameUrdu,
      customerVehicleNumber,
      customerPhone,
      customerPartyId,
      recoveryAmount,
      paymentMethod,
      bankId,
      description,
      descriptionUrdu,
      date
    } = req.body;

    // Store old values for comparison
    const oldAmount = recovery.recoveryAmount;
    const oldDate = recovery.date;
    const oldCustomerName = recovery.customerName;
    const oldCustomerNameUrdu = recovery.customerNameUrdu;
    const oldSerialNumber = recovery.serialNumber;

    if (customerName !== undefined) recovery.customerName = customerName;
    if (customerNameUrdu !== undefined) recovery.customerNameUrdu = customerNameUrdu;
    if (customerVehicleNumber !== undefined) recovery.customerVehicleNumber = customerVehicleNumber;
    if (customerPhone !== undefined) recovery.customerPhone = customerPhone;
    if (customerPartyId !== undefined) recovery.customerPartyId = customerPartyId || null;
    if (recoveryAmount !== undefined) recovery.recoveryAmount = recoveryAmount;
    if (paymentMethod !== undefined) recovery.paymentMethod = paymentMethod;
    if (description !== undefined) recovery.description = description;
    if (descriptionUrdu !== undefined) recovery.descriptionUrdu = descriptionUrdu;
    if (date !== undefined) recovery.date = new Date(date);

    await recovery.save();

    // Update related LedgerTransaction if it exists
    try {
      const ledgerTx = await LedgerTransaction.findOne({
        companyId,
        recoveryId: recovery._id
      });

      if (ledgerTx) {
        // Store old party ID to recalculate its balance if party changed
        const oldPartyId = ledgerTx.partyId ? ledgerTx.partyId.toString() : null;

        // Find party (could be old or new)
        let party = null;
        if (customerPartyId) {
          party = await LedgerParty.findOne({ _id: customerPartyId, companyId });
        } else {
          // Try to find by customer name
          const searchName = customerNameUrdu || customerName || oldCustomerNameUrdu || oldCustomerName;
          if (searchName) {
            party = await LedgerParty.findOne({
              companyId,
              $or: [
                { name: searchName },
                { nameUrdu: searchName }
              ]
            });
          }
        }

        // If party found, update the transaction
        if (party) {
          const finalAmount = recoveryAmount !== undefined ? recoveryAmount : oldAmount;
          const finalDate = date ? new Date(date) : oldDate;
          const finalCustomerName = customerNameUrdu || customerName || oldCustomerNameUrdu || oldCustomerName;
          const finalSerialNumber = oldSerialNumber || recovery.serialNumber;
          const newPartyId = party._id.toString();

          // If party changed, recalculate old party balance first
          if (oldPartyId && oldPartyId !== newPartyId) {
            const oldParty = await LedgerParty.findOne({ _id: oldPartyId, companyId });
            if (oldParty) {
              const oldTransactions = await LedgerTransaction.find({ companyId, partyId: oldPartyId })
                .sort({ date: 1, createdAt: 1 });

              await recalcPartyBalances(companyId, oldPartyId);
            }
          } else if (oldPartyId && oldPartyId === newPartyId) {
            // Same party but amount/date might have changed - recalculate old party balance first
            const oldParty = await LedgerParty.findOne({ _id: oldPartyId, companyId });
            if (oldParty) {
              // Temporarily remove this transaction to recalculate without it
              const tempAmount = ledgerTx.amount;
              ledgerTx.amount = 0;
              await ledgerTx.save();

              const oldTransactions = await LedgerTransaction.find({ companyId, partyId: oldPartyId })
                .sort({ date: 1, createdAt: 1 });

              let oldBalance = oldParty.openingBalance || 0;
              for (const tx of oldTransactions) {
                if (oldParty.type === 'supplier') {
                  if (tx.type === 'debit') {
                    oldBalance += tx.amount;
                  } else if (tx.type === 'credit') {
                    oldBalance -= tx.amount;
                  }
                } else {
                  if (tx.type === 'debit') {
                    oldBalance += tx.amount;
                  } else if (tx.type === 'credit') {
                    oldBalance -= tx.amount;
                  }
                }
                tx.balanceAfter = oldBalance;
                await tx.save();
              }

              // Restore transaction amount
              ledgerTx.amount = tempAmount;
            }
          }

          // Update transaction
          ledgerTx.partyId = party._id;
          ledgerTx.amount = finalAmount;
          ledgerTx.date = finalDate;
          ledgerTx.description = isUrdu
            ? `ریکوری #${finalSerialNumber} - ${finalCustomerName}`
            : `Recovery #${finalSerialNumber} - ${finalCustomerName}`;
          ledgerTx.type = party.type === 'supplier' ? 'debit' : 'credit';
          await ledgerTx.save();

          // Recalculate new party balance (always recalculate to ensure accuracy)
          await recalcPartyBalances(companyId, party._id);
        } else if (oldPartyId) {
          // Party not found but old transaction exists - recalculate old party balance
          const oldParty = await LedgerParty.findOne({ _id: oldPartyId, companyId });
          await recalcPartyBalances(companyId, oldPartyId);
        }
      } else if (customerPartyId && recoveryAmount > 0) {
        // No existing transaction, create new one (similar to create recovery logic)
        let party = await LedgerParty.findOne({ _id: customerPartyId, companyId });

        if (!party && (customerName || customerNameUrdu)) {
          party = await LedgerParty.findOne({
            companyId,
            $or: [
              { name: customerName },
              { nameUrdu: customerName },
              { name: customerNameUrdu },
              { nameUrdu: customerNameUrdu }
            ]
          });
        }

        if (party) {
          const finalSerialNumber = recovery.serialNumber || oldSerialNumber;
          const finalCustomerName = customerNameUrdu || customerName || '';

          // Get company to check language preference
          const Company = require('../models/Company');
          const company = await Company.findById(companyId);
          const isUrdu = company?.language === 'ur';

          const ledgerTx = new LedgerTransaction({
            companyId,
            partyId: party._id,
            billId: null,
            recoveryId: recovery._id,
            date: date ? new Date(date) : recovery.date,
            description: isUrdu
              ? `ریکوری #${finalSerialNumber} - ${finalCustomerName}`
              : `Recovery #${finalSerialNumber} - ${finalCustomerName}`,
            type: party.type === 'supplier' ? 'debit' : 'credit',
            amount: recoveryAmount || recovery.recoveryAmount
          });
          await ledgerTx.save();

          // Recalculate party balance
          await recalcPartyBalances(companyId, party._id);
        }
      }
    } catch (ledgerError) {
      console.error('Update recovery ledger transaction error:', ledgerError);
      // Don't fail recovery update if ledger transaction update fails
    }

    // Update related BankTransaction if it exists
    try {
      if (paymentMethod && recoveryAmount > 0) {
        const bankTx = await BankTransaction.findOne({
          companyId,
          recoveryId: recovery._id
        });

        if (bankTx) {
          let bank = null;
          if (bankId) {
            bank = await Bank.findOne({
              _id: bankId,
              companyId,
              isAdminManaged: true,
              isActive: true
            });
          }

          if (!bank) {
            bank = await Bank.findOne({
              companyId,
              isAdminManaged: true,
              $or: [
                { bankName: paymentMethod },
                { bankNameUrdu: paymentMethod }
              ],
              isActive: true
            });
          }

          if (bank) {
            const finalAmount = recoveryAmount !== undefined ? recoveryAmount : oldAmount;
            const finalDate = date ? new Date(date) : oldDate;
            const finalCustomerName = customerNameUrdu || customerName || oldCustomerNameUrdu || oldCustomerName;
            const finalSerialNumber = recovery.serialNumber || oldSerialNumber;

            // Update bank transaction
            bankTx.amount = finalAmount;
            bankTx.date = finalDate;
            bankTx.description = isUrdu
              ? `ریکوری #${finalSerialNumber} - ${finalCustomerName}`
              : `Recovery #${finalSerialNumber} - ${finalCustomerName}`;
            bankTx.descriptionUrdu = `ریکوری #${finalSerialNumber} - ${finalCustomerName}`;
            await bankTx.save();

            // Recalculate bank balance
            const allTransactions = await BankTransaction.find({ bankId: bank._id })
              .sort({ date: 1, createdAt: 1 });

            // Recalculate bank balance
            await recalcBankBalances(companyId, bank._id);
          }
        }
      }
    } catch (bankError) {
      console.error('Update recovery bank transaction error:', bankError);
      // Don't fail recovery update if bank transaction update fails
    }

    res.json({
      message: 'Recovery updated successfully',
      recovery
    });
  } catch (error) {
    console.error('Update recovery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Delete recovery
router.delete('/company/:recoveryId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const recovery = await Recovery.findOne({ _id: req.params.recoveryId, companyId });

    if (!recovery) {
      return res.status(404).json({ message: 'Recovery not found' });
    }

    // Delete related bank transactions
    try {
      await BankTransaction.deleteMany({ companyId, recoveryId: recovery._id });
    } catch (bankError) {
      console.error('Delete recovery bank transactions error:', bankError);
    }

    // Delete related ledger transactions
    try {
      const transactions = await LedgerTransaction.find({
        companyId,
        recoveryId: recovery._id
      });

      if (transactions.length > 0) {
        const partyIds = [...new Set(transactions.map(tx => tx.partyId?.toString()).filter(Boolean))];

        // Delete all transactions linked to this recovery
        await LedgerTransaction.deleteMany({ companyId, recoveryId: recovery._id });

        // Recalculate balances for affected parties
        for (const partyId of partyIds) {
          const party = await LedgerParty.findOne({ _id: partyId, companyId });
          if (party) {
            const remainingTransactions = await LedgerTransaction.find({
              companyId,
              partyId: partyId
            }).sort({ date: 1, createdAt: 1 });

            await recalcPartyBalances(companyId, partyId);
          }
        }
      }

      // Also check for transactions by description pattern (for old recoveries without recoveryId)
      // Match both English and Urdu patterns
      const serialNumber = recovery.serialNumber || '';
      const descriptionPatterns = [
        new RegExp(`Recovery #${serialNumber}`, 'i'),
        new RegExp(`ریکوری #${serialNumber}`, 'i'),
        new RegExp(`ریکوری.*#${serialNumber}`, 'i')
      ];

      for (const pattern of descriptionPatterns) {
        const oldTransactions = await LedgerTransaction.find({
          companyId,
          description: pattern,
          $or: [
            { recoveryId: null },
            { recoveryId: { $exists: false } }
          ]
        });

        if (oldTransactions.length > 0) {
          const oldPartyIds = [...new Set(oldTransactions.map(tx => tx.partyId?.toString()).filter(Boolean))];
          await LedgerTransaction.deleteMany({
            companyId,
            description: pattern,
            $or: [
              { recoveryId: null },
              { recoveryId: { $exists: false } }
            ]
          });

          // Recalculate balances for affected parties
          for (const partyId of oldPartyIds) {
            const party = await LedgerParty.findOne({ _id: partyId, companyId });
            if (party) {
              const remainingTransactions = await LedgerTransaction.find({
                companyId,
                partyId: partyId
              }).sort({ date: 1, createdAt: 1 });

              await recalcPartyBalances(companyId, partyId);
            }
          }
        }
      }
    } catch (ledgerError) {
      console.error('Delete recovery ledger transactions error:', ledgerError);
    }

    // Delete the recovery
    await Recovery.findByIdAndDelete(recovery._id);

    res.json({ message: 'Recovery deleted successfully' });
  } catch (error) {
    console.error('Delete recovery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

