const Certificate = require("../models/certificateSchema.js");

const getNextCertificateNumber = async (schoolId, type) => {
  try {
    const year = new Date().getFullYear();
    const prefix = type === "Character" ? `CSS-Char-${year}-` : `CSS-Cer-${year}-`;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = new RegExp(`^${escapedPrefix}\\d+$`);

    const certificates = await Certificate.find({
      school: schoolId,
      certificateNo: {
        $exists: true,
        $ne: null,
        $regex: regexPattern
      },
    })
      .select("certificateNo")
      .lean();

    let max = 0;
    certificates.forEach((c) => {
      if (c && c.certificateNo && typeof c.certificateNo === 'string') {
        const numPart = c.certificateNo.replace(prefix, "");
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });

    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  } catch (error) {
    console.error("Error in getNextCertificateNumber:", error);
    throw error;
  }
};

const getNextCertificateNumberHandler = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { type } = req.query;
    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }
    const certificateNo = await getNextCertificateNumber(schoolId, type);
    res.json({ certificateNo });
  } catch (err) {
    console.error("Error in getNextCertificateNumberHandler:", err);
    res.status(500).json({ message: err.message || "Failed to get next certificate number" });
  }
};

const createCertificate = async (req, res) => {
  try {
    const schoolId = req.body.school;
    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    // Auto generate if missing
    if (!req.body.certificateNo) {
      req.body.certificateNo = await getNextCertificateNumber(schoolId, req.body.certificateType);
    }

    const certificate = new Certificate(req.body);
    const result = await certificate.save();
    res.status(200).json({ data: result, ok: true, message: "Certificate saved successfully" });
  } catch (err) {
    console.error("Error in createCertificate:", err);
    res.status(500).json({ message: err.message || "Failed to save certificate" });
  }
};

const getCertificates = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { studentId, type } = req.query;
    
    let query = { school: schoolId };
    if (studentId) query.student = studentId;
    if (type) query.certificateType = type;

    const data = await Certificate.find(query)
      .populate("student", "name rollNum registerNumber")
      .populate("teacher", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCertificate = async (req, res) => {
  try {
    const result = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ ok: true, data: result, message: "Certificate updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCertificate = async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.status(200).json({ ok: true, message: "Certificate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getNextCertificateNumberHandler,
  createCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate
};
