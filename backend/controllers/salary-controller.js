const SalarySlip = require("../models/salarySlipSchema.js");
const Teacher = require("../models/teacherSchema.js");

const createSalarySlip = async (req, res) => {
    try {
        const { employee, school, month, basicSalary, allowances, deductions, netSalary } = req.body;

        // Check if slip already exists for this employee and month
        const existingSlip = await SalarySlip.findOne({ employee, month });
        if (existingSlip) {
            // Update existing slip
            const updatedSlip = await SalarySlip.findByIdAndUpdate(
                existingSlip._id,
                { basicSalary, allowances, deductions, netSalary },
                { new: true }
            );
            return res.status(200).json({ data: updatedSlip, ok: true, message: "Salary slip updated" });
        }

        const newSlip = new SalarySlip({
            employee,
            school,
            month,
            basicSalary,
            allowances,
            deductions,
            netSalary
        });

        const savedSlip = await newSlip.save();
        res.status(201).json({ data: savedSlip, ok: true, message: "Salary slip created" });
    } catch (error) {
        res.status(500).json({ message: error.message, ok: false });
    }
};

const getSalarySlips = async (req, res) => {
    try {
        const { schoolId, month } = req.params;
        const query = { school: schoolId };
        if (month && month !== "all") {
            query.month = month;
        }

        const slips = await SalarySlip.find(query).populate("employee", "name employeeId designation department");
        res.status(200).json({ data: slips, ok: true });
    } catch (error) {
        res.status(500).json({ message: error.message, ok: false });
    }
};

const deleteSalarySlip = async (req, res) => {
    try {
        await SalarySlip.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Salary slip deleted", ok: true });
    } catch (error) {
        res.status(500).json({ message: error.message, ok: false });
    }
};

module.exports = {
    createSalarySlip,
    getSalarySlips,
    deleteSalarySlip,
};
