const express = require('express');
const router = express.Router();
const DailyKharcha = require('../models/DailyKharcha');
const { verifyCompany } = require('../middleware/auth');

// Company: Get all daily kharcha entries (with pagination)
router.get('/company/all', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { page, limit = 50 } = req.query;

    const total = await DailyKharcha.countDocuments({ companyId });
    const limitNum = Math.min(parseInt(limit, 10) || 50, 500);
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    const dailyKharchas = await DailyKharcha.find({ companyId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      dailyKharchas,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get daily kharcha error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Create new daily kharcha entry
router.post('/company/create', verifyCompany, async (req, res) => {
  try {
    const { date, amount, tafseel, tafseelUrdu, paymentMethod } = req.body;
    const companyId = req.user.id;

    const dailyKharcha = new DailyKharcha({
      companyId,
      date: date ? new Date(date) : new Date(),
      amount: parseFloat(amount) || 0,
      tafseel: tafseel || '',
      tafseelUrdu: tafseelUrdu || '',
      paymentMethod: paymentMethod || ''
    });

    await dailyKharcha.save();

    res.json({
      message: 'Daily kharcha created successfully',
      dailyKharcha
    });
  } catch (error) {
    console.error('Create daily kharcha error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Update daily kharcha entry
router.put('/company/:dailyKharchaId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { dailyKharchaId } = req.params;
    const { date, amount, tafseel, tafseelUrdu, paymentMethod } = req.body;

    const dailyKharcha = await DailyKharcha.findOne({ _id: dailyKharchaId, companyId });

    if (!dailyKharcha) {
      return res.status(404).json({ message: 'Daily kharcha not found' });
    }

    if (date !== undefined) dailyKharcha.date = new Date(date);
    if (amount !== undefined) dailyKharcha.amount = parseFloat(amount) || 0;
    if (tafseel !== undefined) dailyKharcha.tafseel = tafseel || '';
    if (tafseelUrdu !== undefined) dailyKharcha.tafseelUrdu = tafseelUrdu || '';
    if (paymentMethod !== undefined) dailyKharcha.paymentMethod = paymentMethod || '';

    await dailyKharcha.save();

    res.json({
      message: 'Daily kharcha updated successfully',
      dailyKharcha
    });
  } catch (error) {
    console.error('Update daily kharcha error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Company: Delete daily kharcha entry
router.delete('/company/:dailyKharchaId', verifyCompany, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { dailyKharchaId } = req.params;

    const dailyKharcha = await DailyKharcha.findOneAndDelete({ _id: dailyKharchaId, companyId });

    if (!dailyKharcha) {
      return res.status(404).json({ message: 'Daily kharcha not found' });
    }

    res.json({ message: 'Daily kharcha deleted successfully' });
  } catch (error) {
    console.error('Delete daily kharcha error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

