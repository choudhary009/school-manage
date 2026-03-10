const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Admin"
    },
    schoolName: {
        type: String,
        unique: true,
        required: true
    },
    // Optional profile image (Base64 string or URL)
    profileImage: {
        type: String,
    },
    schoolDetailsEntered: {
        type: String,
        enum: ["yes", "no"],
        default: "no"
    },
    // Super Admin: which dashboard pages this admin can see (empty = all enabled)
    enabledDashboardPages: {
        type: [String],
        default: undefined
    }
});

module.exports = mongoose.model("admin", adminSchema)