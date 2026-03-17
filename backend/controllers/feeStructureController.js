const FeeStructure = require("../models/feeStructureSchema");

const createFeeStructure = async (req, res) => {
  try {
    const { classId, school } = req.body;
    
    // Check if fee structure already exists for this class
    const existing = await FeeStructure.findOne({ classId, school });
    if (existing) {
      return res.status(400).json({ 
        ok: false, 
        message: "Fee structure already exists for this class. Please update instead." 
      });
    }

    const feeStructure = new FeeStructure(req.body);
    const saved = await feeStructure.save();
    res.status(200).json({ 
      ok: true, 
      data: saved, 
      message: "Fee structure created successfully" 
    });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    res.status(500).json({ 
      ok: false, 
      message: error.message || "Failed to create fee structure" 
    });
  }
};

const getFeeStructures = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const structures = await FeeStructure.find({ school: schoolId })
      .populate("classId", "sclassName sclassSection")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      ok: true, 
      data: structures 
    });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    res.status(500).json({ 
      ok: false, 
      message: error.message || "Failed to fetch fee structures" 
    });
  }
};

const getFeeStructureByClass = async (req, res) => {
  try {
    const { classId, schoolId } = req.params;
    const structure = await FeeStructure.findOne({ 
      classId, 
      school: schoolId 
    }).populate("classId", "sclassName sclassSection");
    
    if (!structure) {
      return res.status(404).json({ 
        ok: false, 
        message: "Fee structure not found for this class" 
      });
    }
    
    res.status(200).json({ 
      ok: true, 
      data: structure 
    });
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    res.status(500).json({ 
      ok: false, 
      message: error.message || "Failed to fetch fee structure" 
    });
  }
};

const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await FeeStructure.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate("classId", "sclassName sclassSection");
    
    if (!updated) {
      return res.status(404).json({ 
        ok: false, 
        message: "Fee structure not found" 
      });
    }
    
    res.status(200).json({ 
      ok: true, 
      data: updated, 
      message: "Fee structure updated successfully" 
    });
  } catch (error) {
    console.error("Error updating fee structure:", error);
    res.status(500).json({ 
      ok: false, 
      message: error.message || "Failed to update fee structure" 
    });
  }
};

const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FeeStructure.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        ok: false, 
        message: "Fee structure not found" 
      });
    }
    
    res.status(200).json({ 
      ok: true, 
      message: "Fee structure deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    res.status(500).json({ 
      ok: false, 
      message: error.message || "Failed to delete fee structure" 
    });
  }
};

module.exports = {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureByClass,
  updateFeeStructure,
  deleteFeeStructure,
};
