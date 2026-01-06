const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
      unique: true,
    },
    teacherPermissions: {
      home: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      complain: { type: Boolean, default: true },
      classRelated: { type: Boolean, default: true },
      uploadPaper: { type: Boolean, default: true },
      enterMarks: { type: Boolean, default: true },
      reportGenerate: { type: Boolean, default: true },
    },
    studentPermissions: {
      home: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      subjects: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      complain: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RolePermission", rolePermissionSchema);

