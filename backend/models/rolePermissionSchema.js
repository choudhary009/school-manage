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
      takeAttendance: { type: Boolean, default: true },
      timetable: { type: Boolean, default: true },
      onlineClasses: { type: Boolean, default: true },
      messaging: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      myAttendance: { type: Boolean, default: true },
      classTest: { type: Boolean, default: true },
    },
    studentPermissions: {
      home: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      subjects: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      complain: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      timetable: { type: Boolean, default: true },
      onlineClasses: { type: Boolean, default: true },
      examPapers: { type: Boolean, default: true },
      fineArrears: { type: Boolean, default: true },
      feeSlips: { type: Boolean, default: true },
      scholarshipSlips: { type: Boolean, default: true },
      messaging: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      teacherRating: { type: Boolean, default: true },
      classTest: { type: Boolean, default: true },
    },

    administratorPermissions: {
      home: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      studentManagement: { type: Boolean, default: true },
      teacherManagement: { type: Boolean, default: true },
      classManagement: { type: Boolean, default: true },
      subjectManagement: { type: Boolean, default: true },
      feeManagement: { type: Boolean, default: true },
      attendanceManagement: { type: Boolean, default: true },
      examManagement: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      settings: { type: Boolean, default: true },
    },
    schoolBranchPermissions: {
      home: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      studentManagement: { type: Boolean, default: true },
      teacherManagement: { type: Boolean, default: true },
      classManagement: { type: Boolean, default: true },
      subjectManagement: { type: Boolean, default: true },
      feeManagement: { type: Boolean, default: true },
      attendanceManagement: { type: Boolean, default: true },
      examManagement: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      timetable: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RolePermission", rolePermissionSchema);

