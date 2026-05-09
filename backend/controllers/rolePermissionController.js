const RolePermission = require("../models/rolePermissionSchema.js");

// Get or create role permissions for a school
const getRolePermissions = async (req, res) => {
  try {
    const schoolId = req.params.id;
    let permissions = await RolePermission.findOne({ school: schoolId });

    if (!permissions) {
      // Create default permissions if not exists
      permissions = new RolePermission({
        school: schoolId,
        teacherPermissions: {
          home: true,
          profile: true,
          complain: true,
          classRelated: true,
          uploadPaper: true,
          enterMarks: true,
          reportGenerate: true,
          takeAttendance: true,
          timetable: true,
          onlineClasses: true,
          messaging: true,
          announcements: true,
          myAttendance: true,
        },
        studentPermissions: {
          home: true,
          profile: true,
          subjects: true,
          attendance: true,
          complain: true,
          assignments: true,
          timetable: true,
          onlineClasses: true,
          examPapers: true,
          fineArrears: true,
          feeSlips: true,
          scholarshipSlips: true,
          messaging: true,
          announcements: true,
          teacherRating: true,
        },
        administratorPermissions: {
          home: true,
          profile: true,
          studentManagement: true,
          teacherManagement: true,
          classManagement: true,
          subjectManagement: true,
          feeManagement: true,
          attendanceManagement: true,
          examManagement: true,
          reports: true,
          settings: true,
        },
        schoolBranchPermissions: {
          home: true,
          profile: true,
          studentManagement: true,
          teacherManagement: true,
          classManagement: true,
          subjectManagement: true,
          feeManagement: true,
          attendanceManagement: true,
          examManagement: true,
          reports: true,
          timetable: true,
        },
      });
      await permissions.save();
    }

    res.status(200).json({ ok: true, data: permissions });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Update role permissions
const updateRolePermissions = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const { teacherPermissions, studentPermissions, administratorPermissions, schoolBranchPermissions } = req.body;

    let permissions = await RolePermission.findOne({ school: schoolId });

    if (!permissions) {
      permissions = new RolePermission({
        school: schoolId,
        teacherPermissions: teacherPermissions || {},
        studentPermissions: studentPermissions || {},
        administratorPermissions: administratorPermissions || {},
        schoolBranchPermissions: schoolBranchPermissions || {},
      });
    } else {
      if (teacherPermissions) {
        permissions.teacherPermissions = {
          ...permissions.teacherPermissions,
          ...teacherPermissions,
        };
      }
      if (studentPermissions) {
        permissions.studentPermissions = {
          ...permissions.studentPermissions,
          ...studentPermissions,
        };
      }
      if (administratorPermissions) {
        permissions.administratorPermissions = {
          ...permissions.administratorPermissions,
          ...administratorPermissions,
        };
      }
      if (schoolBranchPermissions) {
        permissions.schoolBranchPermissions = {
          ...permissions.schoolBranchPermissions,
          ...schoolBranchPermissions,
        };
      }
    }

    await permissions.save();
    res
      .status(200)
      .json({ ok: true, data: permissions, message: "Permissions updated successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

module.exports = {
  getRolePermissions,
  updateRolePermissions,
};

