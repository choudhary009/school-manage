const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Company = require('../models/Company');
const LedgerParty = require('../models/LedgerParty');
const LedgerTransaction = require('../models/LedgerTransaction');
const { verifyAdmin, verifyCompany } = require('../middleware/auth');

// Admin: Get all bills
router.get('/admin/all', verifyAdmin, async (req, res) => {
  try {
    const bills = await Bill.find().populate('companyId', 'username email shopName');
    res.json({ bills });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get bills for a specific company
router.get('/admin/company/:companyId', verifyAdmin, async (req, res) => {
  try {
    const bills = await Bill.find({ companyId: req.params.companyId }).sort({ createdAt: -1 });
    res.json({ bills });
  } catch (error) {
    console.error('Get company bills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Create bill template for company
router.post('/admin/template', verifyAdmin, async (req, res) => {
  try {
    const { companyId, templateSettings, expenseFields, salesFields } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Create or update bill template
    let billTemplate = await Bill.findOne({ companyId, status: 'draft' });

    if (billTemplate) {
      // Update existing template
      if (templateSettings) billTemplate.templateSettings = templateSettings;
      if (expenseFields) billTemplate.expenseFields = expenseFields;
      if (salesFields) billTemplate.salesFields = salesFields;
      await billTemplate.save();
    } else {
      // Create new template
      billTemplate = new Bill({
        companyId,
        templateSettings: templateSettings || {},
        expenseFields: expenseFields || [],
        salesFields: salesFields || []
      });
      await billTemplate.save();
    }

    res.json({
      message: 'Bill template saved successfully',
      bill: billTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Create new bill for company
router.post('/admin/create', verifyAdmin, async (req, res) => {
  try {
    const { companyId, serialNumber, voucherNumber, customerName, customerNameUrdu, date, receivedMessage, receivedMessageUrdu, goodsMessage, goodsMessageUrdu, expenses, sales, expenseFields, salesFields } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Get template
    const template = await Bill.findOne({ companyId }).sort({ createdAt: -1 });

    // Default expense and sales fields if not provided
    const defaultExpenseFields = [
      { fieldName: 'Vehicle', fieldNameUrdu: 'گاڑی', fieldType: 'number', isRequired: false, order: 0 },
      { fieldName: 'Cash', fieldNameUrdu: 'نقدی', fieldType: 'number', isRequired: false, order: 1 },
      { fieldName: 'Rent', fieldNameUrdu: 'کرایہ', fieldType: 'number', isRequired: false, order: 2 },
      { fieldName: 'Commission', fieldNameUrdu: 'کمیشن', fieldType: 'number', isRequired: false, order: 3 },
      { fieldName: 'Labor', fieldNameUrdu: 'مزدوری', fieldType: 'number', isRequired: false, order: 4 },
      { fieldName: 'Miscellaneous', fieldNameUrdu: 'مشیانہ', fieldType: 'number', isRequired: false, order: 5 },
      { fieldName: 'Market Fee', fieldNameUrdu: 'مارکیٹ فیس', fieldType: 'number', isRequired: false, order: 6 }
    ];

    const defaultSalesFields = [
      { fieldName: 'Raw Sale', fieldNameUrdu: 'خام بِکری', fieldType: 'number', isRequired: true, order: 0 },
      { fieldName: 'Expenses', fieldNameUrdu: 'اخراجات', fieldType: 'number', isRequired: false, order: 1 },
      { fieldName: 'Net Sale', fieldNameUrdu: 'پختہ بِکری', fieldType: 'number', isRequired: false, order: 2 }
    ];

    const bill = new Bill({
      companyId,
      serialNumber: serialNumber || '',
      voucherNumber: voucherNumber || '',
      customerName: customerName || '',
      customerNameUrdu: customerNameUrdu || '',
      date: date ? new Date(date) : new Date(),
      receivedMessage: receivedMessage || 'Received, thanks for selling',
      receivedMessageUrdu: receivedMessageUrdu || 'وصول ہوا ہے بیجنے کا شکریہ',
      goodsMessage: goodsMessage || 'Your goods via consignment/bill of lading',
      goodsMessageUrdu: goodsMessageUrdu || 'آپکا مال بذریعہ بلٹی',
      expenses: expenses || {},
      sales: sales || {},
      expenseFields: expenseFields && expenseFields.length > 0 ? expenseFields : (template?.expenseFields && template.expenseFields.length > 0 ? template.expenseFields : defaultExpenseFields),
      salesFields: salesFields && salesFields.length > 0 ? salesFields : (template?.salesFields && template.salesFields.length > 0 ? template.salesFields : defaultSalesFields),
      templateSettings: template?.templateSettings || {},
      status: 'completed'
    });

    // Calculate totals
    let totalExpenses = 0;
    if (expenses) {
      Object.values(expenses).forEach(value => {
        if (typeof value === 'number') {
          totalExpenses += value;
        }
      });
    }

    bill.totalAmount = totalExpenses;
    // For req.body objects, dot notation is fine
    bill.rawSale = sales?.rawSale || sales?.['Raw Sale'] || 0;
    bill.netSale = (bill.rawSale || 0) - totalExpenses;

    await bill.save();

    res.json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update bill
router.put('/admin/:billId', verifyAdmin, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { serialNumber, customerName, customerNameUrdu, date, expenses, sales, expenseFields, salesFields, templateSettings } = req.body;

    if (serialNumber !== undefined) bill.serialNumber = serialNumber;
    if (customerName !== undefined) bill.customerName = customerName;
    if (customerNameUrdu !== undefined) bill.customerNameUrdu = customerNameUrdu;
    if (date) bill.date = new Date(date);
    if (expenses) bill.expenses = expenses;
    if (sales) bill.sales = sales;
    if (expenseFields) bill.expenseFields = expenseFields;
    if (salesFields) bill.salesFields = salesFields;
    if (templateSettings) bill.templateSettings = templateSettings;

    // Recalculate totals
    let totalExpenses = 0;
    if (bill.expenses) {
      // bill.expenses is a Map
      for (const value of bill.expenses.values()) {
        if (typeof value === 'number') {
          totalExpenses += value;
        }
      }
    }

    bill.totalAmount = totalExpenses;
    bill.rawSale = bill.sales?.get('rawSale') || bill.sales?.get('Raw Sale') || 0;
    bill.netSale = (bill.rawSale || 0) - totalExpenses;

    await bill.save();

    res.json({
      message: 'Bill updated successfully',
      bill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete bill
router.delete('/admin/:billId', verifyAdmin, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.billId);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Get their bills (with pagination)
const getCompanyBillsHandler = async (req, res) => {
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
        { voucherNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Bill.countDocuments(query);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 10000);
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    const bills = await Bill.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      bills,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get company bills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Original route
router.get('/company/my-bills', verifyCompany, getCompanyBillsHandler);

// Backward-compatible alias for existing frontend calls: /bill/company/all
router.get('/company/all', verifyCompany, getCompanyBillsHandler);

// Company: Get latest bill template (for expense/sales fields)
router.get('/company/latest-template', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const template = await Bill.findOne({ companyId }).sort({ createdAt: -1 });

    if (template) {
      res.json({ template });
    } else {
      res.json({ template: null });
    }
  } catch (error) {
    console.error('Get latest template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Create new bill
router.post('/company/create', verifyCompany, async (req, res) => {
  try {
    const { serialNumber, voucherNumber, customerName, customerNameUrdu, customerPartyId, date, receivedMessage, receivedMessageUrdu, goodsMessage, goodsMessageUrdu, expenses, sales, expenseFields, salesFields } = req.body;
    const companyId = req.user.id;

    // Get template or use defaults
    const template = await Bill.findOne({ companyId }).sort({ createdAt: -1 });

    // Get company info for template
    const company = await Company.findById(companyId);

    // Auto-increment serial number if not provided or empty
    let finalSerialNumber = serialNumber?.toString().trim() || '';
    if (!finalSerialNumber) {
      // Find all bills for this company and get the highest serial number
      const allBills = await Bill.find({ companyId }).select('serialNumber');
      let maxSerial = 0;

      allBills.forEach(bill => {
        const sn = bill.serialNumber?.toString().trim() || '';
        const num = parseInt(sn, 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      });

      finalSerialNumber = String(maxSerial + 1);
    }

    const bill = new Bill({
      companyId,
      serialNumber: finalSerialNumber,
      // For now, keep voucherNumber in sync with serial if not provided
      voucherNumber: (voucherNumber && voucherNumber.toString().trim()) || String(finalSerialNumber),
      customerName: customerName || '',
      customerNameUrdu: customerNameUrdu || '',
      customerPartyId: customerPartyId || null,
      date: date ? new Date(date) : new Date(),
      expenses: expenses || {},
      sales: sales || {},
      expenseFields: (expenseFields && expenseFields.length > 0) ? expenseFields : (template?.expenseFields || []),
      salesFields: (salesFields && salesFields.length > 0) ? salesFields : (template?.salesFields || []),
      templateSettings: template?.templateSettings || {
        companyName: company?.shopName || company?.username || '',
        companyNameUrdu: company?.shopNameUrdu || '',
        logo: company?.logo || '',
        address: company?.address || '',
        addressUrdu: company?.addressUrdu || '',
        contactInfo: (company?.persons || []).map(p => ({
          name: p.name,
          nameUrdu: p.nameUrdu || p.name,
          phone: p.contactNumber
        }))
      },
      status: 'completed'
    });

    // Calculate totals
    let totalExpenses = 0;
    if (expenses) {
      Object.values(expenses).forEach(value => {
        if (typeof value === 'number') {
          totalExpenses += value;
        }
      });
    }

    bill.totalAmount = totalExpenses;
    bill.rawSale = sales?.rawSale || sales?.['Raw Sale'] || 0;
    bill.netSale = (bill.rawSale || 0) - totalExpenses;

    await bill.save();

    // Auto-create ledger transactions for supplier if customerPartyId is provided
    if (customerPartyId) {
      try {
        const party = await LedgerParty.findOne({ _id: customerPartyId, companyId });
        if (party && party.type === 'supplier') {
          // Check if transactions already exist for this bill (prevent duplicates)
          const existingTransactions = await LedgerTransaction.find({ billId: bill._id });
          if (existingTransactions.length > 0) {
            // Delete existing transactions to avoid duplicates
            await LedgerTransaction.deleteMany({ billId: bill._id });
          }

          // Create ONLY ONE transaction for Net Sale: پختہ بِکری (credit/recovery)
          // Net Sale goes to recovery field, nothing goes to sale
          const netSale = bill.netSale || 0;

          const billSerial = bill.serialNumber || bill._id?.toString().slice(-6) || '';
          const billDescription = 'بل #' + billSerial;

          if (netSale > 0) {
            const recoveryTx = new LedgerTransaction({
              companyId,
              partyId: customerPartyId,
              billId: bill._id,
              date: bill.date,
              description: billDescription + ' (ریکوری)',
              type: 'credit',
              amount: netSale
            });
            await recoveryTx.save();
          }

          // Recalculate party balances
          await recalcPartyBalances(companyId, customerPartyId);
        }
      } catch (ledgerError) {
        console.error('Auto ledger transaction error:', ledgerError);
        // Don't fail bill creation if ledger transaction fails
      }
    }

    res.json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Update bill
router.put('/company/:billId', verifyCompany, async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.billId, companyId: req.user.id });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const companyId = req.user.id;
    const oldCustomerPartyId = bill.customerPartyId ? bill.customerPartyId.toString() : null;

    const { serialNumber, customerName, customerNameUrdu, customerPartyId, date, receivedMessage, receivedMessageUrdu, goodsMessage, goodsMessageUrdu, expenses, sales, expenseFields, salesFields } = req.body;

    if (serialNumber !== undefined) bill.serialNumber = serialNumber;
    if (customerName !== undefined) bill.customerName = customerName;
    if (customerNameUrdu !== undefined) bill.customerNameUrdu = customerNameUrdu;
    if (customerPartyId !== undefined) bill.customerPartyId = customerPartyId || null;
    if (date) bill.date = new Date(date);
    if (expenseFields) bill.expenseFields = expenseFields;
    if (salesFields) bill.salesFields = salesFields;
    if (receivedMessage !== undefined) bill.receivedMessage = receivedMessage;
    if (receivedMessageUrdu !== undefined) bill.receivedMessageUrdu = receivedMessageUrdu;
    if (goodsMessage !== undefined) bill.goodsMessage = goodsMessage;
    if (goodsMessageUrdu !== undefined) bill.goodsMessageUrdu = goodsMessageUrdu;
    if (expenses) bill.expenses = expenses;
    if (sales) {
      // Convert sales object to Map if it's a plain object
      if (sales instanceof Map) {
        bill.sales = sales;
      } else if (sales && typeof sales === 'object') {
        // Convert plain object to Map
        bill.sales = new Map(Object.entries(sales));
      } else {
        bill.sales = sales;
      }
    }

    // Recalculate totals
    let totalExpenses = 0;
    if (bill.expenses) {
      // bill.expenses is a Map
      for (const [key, value] of bill.expenses.entries()) {
        // Skip Vehicle field in total calculation
        if (key !== 'Vehicle' && key !== 'ActualVehicle' && key !== 'ItemName' && key !== 'ItemUnit' && key !== 'ItemQuantity' && key !== 'DeliveryMethod' && key !== 'GoodsMessageUrdu' && typeof value === 'number' && !isNaN(value)) {
          totalExpenses += value;
        }
      }
    }

    bill.totalAmount = totalExpenses;
    // Handle both Map and plain object for sales
    let rawSale = 0;
    if (bill.sales) {
      if (bill.sales instanceof Map) {
        rawSale = bill.sales.get('rawSale') || bill.sales.get('Raw Sale') || 0;
      } else if (bill.sales && typeof bill.sales === 'object') {
        rawSale = bill.sales['rawSale'] || bill.sales['Raw Sale'] || 0;
      }
    }
    bill.rawSale = rawSale;
    bill.netSale = (bill.rawSale || 0) - totalExpenses;

    await bill.save();

    // Update ledger transactions if relevant fields changed
    const newCustomerPartyId = bill.customerPartyId ? bill.customerPartyId.toString() : null;
    const oldDate = req.params.billId; // Placeholder to catch date change? No, let's compare with data from DB if we had it.
    // Actually, we can compare bill properties after save if we had old ones.
    // For simplicity, let's always refresh if any of these are present in req.body.
    const partyIdChanged = oldCustomerPartyId !== newCustomerPartyId;
    const expensesChanged = expenses !== undefined;
    const salesChanged = sales !== undefined;
    const dateChanged = date !== undefined;
    const serialChanged = serialNumber !== undefined;

    // If any relevant part changed, update ledger transactions
    if (partyIdChanged || expensesChanged || salesChanged || dateChanged || serialChanged) {
      try {
        // Delete old ledger transactions for this bill
        await LedgerTransaction.deleteMany({ billId: bill._id });

        // If old party exists and changed, recalculate its balance
        if (oldCustomerPartyId && oldCustomerPartyId !== newCustomerPartyId) {
          await recalcPartyBalances(companyId, oldCustomerPartyId);
        }

        // Create new ledger transactions if new party is supplier
        if (newCustomerPartyId) {
          const party = await LedgerParty.findOne({ _id: newCustomerPartyId, companyId });
          if (party && party.type === 'supplier') {
            // Create ONLY ONE transaction for Net Sale: پختہ بِکری (credit/recovery)
            // Net Sale goes to recovery field, nothing goes to sale
            const netSale = bill.netSale || 0;

            const billSerial = bill.serialNumber || bill._id?.toString().slice(-6) || '';
            const billDescription = 'بل #' + billSerial;

            // Net Sale (pukhta bikri) goes to recovery, nothing goes to sale
            if (netSale > 0) {
              const recoveryTx = new LedgerTransaction({
                companyId,
                partyId: newCustomerPartyId,
                billId: bill._id,
                date: bill.date,
                description: billDescription + ' (ریکوری)',
                type: 'credit',
                amount: netSale
              });
              await recoveryTx.save();
            }

            // Recalculate party balances
            await recalcPartyBalances(companyId, newCustomerPartyId);
          }
        }
      } catch (ledgerError) {
        console.error('Update ledger transaction error:', ledgerError);
        // Don't fail bill update if ledger transaction fails
      }
    }

    res.json({
      message: 'Bill updated successfully',
      bill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Delete bill
router.delete('/company/:billId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const bill = await Bill.findOne({ _id: req.params.billId, companyId });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Delete related ledger transactions
    try {
      const transactions = await LedgerTransaction.find({
        companyId,
        billId: bill._id
      });

      if (transactions.length > 0) {
        const partyIds = [...new Set(transactions.map(tx => tx.partyId?.toString()).filter(Boolean))];

        // Delete all transactions linked to this bill
        await LedgerTransaction.deleteMany({ companyId, billId: bill._id });

        // Recalculate balances for affected parties
        for (const partyId of partyIds) {
          await recalcPartyBalances(companyId, partyId);
        }
      }
    } catch (ledgerError) {
      console.error('Delete bill ledger transactions error:', ledgerError);
    }

    // Delete the bill
    await Bill.findByIdAndDelete(bill._id);

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Get single bill (also allows admin)
router.get('/company/:billId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const decoded = jwt.verify(token, JWT_SECRET);

    const { billId } = req.params;

    // If someone accidentally hits /company/all here, avoid CastError
    if (billId === 'all') {
      return res.status(400).json({ message: 'Invalid bill id \"all\". Use /bill/company/all to fetch all bills.' });
    }

    // Validate ObjectId for safety
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({ message: 'Invalid bill id', billId });
    }

    let bill;
    if (decoded.role === 'super_admin') {
      // Admin can view any bill
      bill = await Bill.findById(billId);
    } else {
      // Company can only view their own bills
      bill = await Bill.findOne({ _id: billId, companyId: decoded.id });
    }

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ bill });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const { recalcPartyBalances } = require('../utils/ledgerUtils');

module.exports = router;

