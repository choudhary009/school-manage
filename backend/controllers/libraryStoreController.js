const Vendor = require("../models/vendorSchema.js");
const BookPurchase = require("../models/bookPurchaseSchema.js");
const BookSale = require("../models/bookSaleSchema.js");
const BookInventory = require("../models/bookInventorySchema.js");
const Student = require("../models/studentSchema.js");

// ========== VENDOR MANAGEMENT ==========

const createVendor = async (req, res) => {
  const { name, contactNumber, email, address, school } = req.body;
  if (!name || !school) {
    return res.status(400).json({ message: "Name and school are required" });
  }
  try {
    const vendor = new Vendor({ name, contactNumber, email, address, school });
    const saved = await vendor.save();
    res.status(201).json({ data: saved, ok: true, message: "Vendor added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create vendor" });
  }
};

const getVendors = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const vendors = await Vendor.find({ school: schoolId }).sort({ createdAt: -1 });
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch vendors" });
  }
};

const updateVendor = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json({ data: updated, ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update vendor" });
  }
};

const deleteVendor = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Vendor.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Vendor not found" });
    res.status(200).json({ message: "Vendor deleted successfully", ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete vendor" });
  }
};

// ========== BOOK PURCHASE ==========

const createBookPurchase = async (req, res) => {
  const { bookName, category, quantity, purchasePrice, purchaseDate, vendor, school } = req.body;
  if (!bookName || !quantity || !purchasePrice || !vendor || !school) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const totalAmount = quantity * purchasePrice;
    const purchase = new BookPurchase({
      bookName,
      category,
      quantity,
      purchasePrice,
      purchaseDate: purchaseDate || new Date(),
      vendor,
      school,
      totalAmount,
    });
    const saved = await purchase.save();

    // Update vendor stats
    await Vendor.findByIdAndUpdate(vendor, {
      $inc: { totalPurchases: 1, totalAmount: totalAmount },
    });

    // Update inventory
    await updateInventory(bookName, category, quantity, 0, school);

    res.status(201).json({ data: saved, ok: true, message: "Purchase recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to record purchase" });
  }
};

const getBookPurchases = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const purchases = await BookPurchase.find({ school: schoolId })
      .populate("vendor", "name contactNumber email")
      .sort({ purchaseDate: -1 });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch purchases" });
  }
};

// ========== BOOK SALE ==========

const createBookSale = async (req, res) => {
  const { bookName, quantity, salePrice, saleDate, studentId, school } = req.body;
  if (!bookName || !quantity || !salePrice || !studentId || !school) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const student = await Student.findById(studentId).populate("sclassName");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Check inventory
    const inventory = await BookInventory.findOne({ bookName, school });
    if (!inventory || inventory.availableStock < quantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    const totalAmount = quantity * salePrice;
    const sale = new BookSale({
      bookName,
      quantity,
      salePrice,
      saleDate: saleDate || new Date(),
      student: studentId,
      studentName: student.name,
      studentRollNum: student.rollNum,
      studentClass: student.sclassName ? `${student.sclassName.sclassName} - ${student.sclassName.sclassSection}` : "",
      school,
      totalAmount,
    });
    const saved = await sale.save();

    // Update inventory
    await updateInventory(bookName, inventory.category || "", 0, quantity, school);

    res.status(201).json({ data: saved, ok: true, message: "Sale recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to record sale" });
  }
};

const getBookSales = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const sales = await BookSale.find({ school: schoolId })
      .populate("student", "name rollNum")
      .sort({ saleDate: -1 });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch sales" });
  }
};

// ========== INVENTORY ==========

const updateInventory = async (bookName, category, purchasedQty, soldQty, school) => {
  const inventory = await BookInventory.findOne({ bookName, school });
  if (inventory) {
    inventory.totalPurchased += purchasedQty;
    inventory.totalSold += soldQty;
    inventory.availableStock = inventory.totalPurchased - inventory.totalSold;
    await inventory.save();
  } else {
    const newInv = new BookInventory({
      bookName,
      category,
      totalPurchased: purchasedQty,
      totalSold: soldQty,
      availableStock: purchasedQty - soldQty,
      school,
    });
    await newInv.save();
  }
};

const getInventory = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const inventory = await BookInventory.find({ school: schoolId }).sort({ bookName: 1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch inventory" });
  }
};

// ========== REPORTS ==========

const getVendorPurchaseReport = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const purchases = await BookPurchase.find({ vendor: vendorId })
      .populate("vendor", "name")
      .sort({ purchaseDate: -1 });
    const total = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    res.status(200).json({ purchases, totalAmount: total, count: purchases.length });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch report" });
  }
};

const getStudentSalesReport = async (req, res) => {
  const { studentId } = req.params;
  try {
    const sales = await BookSale.find({ student: studentId })
      .populate("student", "name rollNum")
      .sort({ saleDate: -1 });
    const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    res.status(200).json({ sales, totalAmount: total, count: sales.length });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch report" });
  }
};

const getSalesReport = async (req, res) => {
  const { schoolId } = req.params;
  const { startDate, endDate } = req.query;
  try {
    const query = { school: schoolId };
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }
    const sales = await BookSale.find(query)
      .populate("student", "name rollNum")
      .sort({ saleDate: -1 });
    const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    res.status(200).json({ sales, totalAmount: total, count: sales.length });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch report" });
  }
};

module.exports = {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  createBookPurchase,
  getBookPurchases,
  createBookSale,
  getBookSales,
  getInventory,
  getVendorPurchaseReport,
  getStudentSalesReport,
  getSalesReport,
};
