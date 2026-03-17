const mongoose = require("mongoose");

const salarySlipSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "teacher",
            required: true,
        },
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admin",
            required: true,
        },
        month: {
            type: String, // format: YYYY-MM
            required: true,
        },
        basicSalary: {
            type: Number,
            required: true,
        },
        allowances: {
            type: Number,
            default: 0,
        },
        deductions: {
            type: Number,
            default: 0,
        },
        netSalary: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            default: "Paid",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("salarySlip", salarySlipSchema);
