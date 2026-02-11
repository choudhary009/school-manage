const router = require("express").Router();

// Health check / root route - useful for Vercel deployment checks
router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "School Backend API connected successfully",
  });
});

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const {
  adminRegister,
  adminLogIn,
  getAdminDetail,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/admin-controller.js");

const {
  sclassCreate,
  sclassList,
  deleteSclass,
  deleteSclasses,
  getSclassDetail,
  getSclassStudents,
  getClassBySection,
} = require("../controllers/class-controller.js");
const {
  complainCreate,
  complainList,
} = require("../controllers/complain-controller.js");
const {
  noticeCreate,
  noticeList,
  deleteNotices,
  deleteNotice,
  updateNotice,
} = require("../controllers/notice-controller.js");
const {
  studentRegister,
  studentLogIn,
  getNextRegisterNumberHandler,
  getStudents,
  getStudentDetail,
  deleteStudents,
  deleteStudent,
  updateStudent,
  studentAttendance,
  deleteStudentsByClass,
  updateExamResult,
  clearAllStudentsAttendanceBySubject,
  clearAllStudentsAttendance,
  removeStudentAttendanceBySubject,
  removeStudentAttendance,
  getClassStudentsAttendance,
  markAllStudentAttendance,
  getStudentAttendanceBySubject,
} = require("../controllers/student_controller.js");
const {
  subjectCreate,
  classSubjects,
  deleteSubjectsByClass,
  getSubjectDetail,
  deleteSubject,
  freeSubjectList,
  allSubjects,
  deleteSubjects,
  getClassesSubjects,
} = require("../controllers/subject-controller.js");
const {
  teacherRegister,
  teacherLogIn,
  getTeachers,
  getTeacherDetail,
  deleteTeachers,
  deleteTeachersByClass,
  deleteTeacher,
  updateTeacher,
  updateTeacherSubject,
  teacherAttendance,
  filterTeacherClassSubjects,
} = require("../controllers/teacher-controller.js");
const {
  createBranch,
  branchLogIn,
  getBranches,
  getBranchDetail,
  getBranchStats,
  updateBranch,
  deleteBranch,
  getBranchStudents,
  getBranchTeachers,
  getBranchSubjects,
} = require("../controllers/branch-controller.js");

const {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureByClass,
  updateFeeStructure,
  deleteFeeStructure,
} = require("../controllers/feeStructureController.js");

// Admin
router.post("/AdminReg", adminRegister);
router.post("/AdminLogin", adminLogIn);

router.get("/Admins", getAllAdmins);
router.get("/Admin/:id", getAdminDetail);
router.put("/Admin/:id", updateAdmin);
router.delete("/Admin/:id", deleteAdmin);

// Student

router.post("/StudentReg", studentRegister);
router.post("/StudentLogin", studentLogIn);
router.get("/NextRegisterNumber/:id", getNextRegisterNumberHandler);

router.get("/Students/:id", getStudents);
router.get("/Student/:id", getStudentDetail);

router.delete("/Students/:id", deleteStudents);
router.delete("/StudentsClass/:id", deleteStudentsByClass);
router.delete("/Student/:id", deleteStudent);

router.put("/Student/:id", updateStudent);

router.put("/UpdateExamResult/:id", updateExamResult);

router.put("/StudentAttendance/:id", studentAttendance);

router.put(
  "/RemoveAllStudentsSubAtten/:id",
  clearAllStudentsAttendanceBySubject
);
router.put("/RemoveAllStudentsAtten/:id", clearAllStudentsAttendance);

router.put("/RemoveStudentSubAtten/:id", removeStudentAttendanceBySubject);
router.put("/RemoveStudentAtten/:id", removeStudentAttendance);

// Teacher

router.post("/TeacherReg", teacherRegister);
router.post("/TeacherLogin", teacherLogIn);

router.get("/Teachers/:id", getTeachers);
router.get("/Teacher/:id", getTeacherDetail);

router.delete("/Teachers/:id", deleteTeachers);
router.delete("/TeachersClass/:id", deleteTeachersByClass);
router.delete("/Teacher/:id", deleteTeacher);

router.put("/Teacher/:id", updateTeacher);
router.put("/TeacherSubject", updateTeacherSubject);

router.post("/TeacherAttendance/:id", teacherAttendance);

// Notice

router.post("/NoticeCreate", noticeCreate);

router.get("/NoticeList/:id", noticeList);

router.delete("/Notices/:id", deleteNotices);
router.delete("/Notice/:id", deleteNotice);

router.put("/Notice/:id", updateNotice);

// Complain

router.post("/ComplainCreate", complainCreate);

router.get("/ComplainList/:id", complainList);

// Sclass

router.post("/SclassCreate", sclassCreate);

router.get("/SclassList/:id", sclassList);
router.get("/Sclass/:id", getSclassDetail);

router.get("/Sclass/Students/:id", getSclassStudents);

router.delete("/Sclasses/:id", deleteSclasses);
router.delete("/Sclass/:id", deleteSclass);

// Subject

router.post("/SubjectCreate", subjectCreate);

router.get("/AllSubjects/:id", allSubjects);
router.get("/ClassSubjects/:id", classSubjects);
router.get("/FreeSubjectList/:id", freeSubjectList);
router.get("/Subject/:id", getSubjectDetail);

router.delete("/Subject/:id", deleteSubject);
router.delete("/Subjects/:id", deleteSubjects);
router.delete("/SubjectsClass/:id", deleteSubjectsByClass);

//School Details
// router.post("/")

// Admin Show Attendance
router.get("/showAttendance/:classId", getClassStudentsAttendance);
router.get("/SclassBySection", getClassBySection);

//mark All attendance
router.put("/markAllStudents", markAllStudentAttendance);
router.post("/getStudentAttendanceBySubject", getStudentAttendanceBySubject);

router.post("/getAllClassesSubjects", getClassesSubjects);

router.get("/filterTeacherSubjects/:id", filterTeacherClassSubjects);

// Role Permissions
const {
  getRolePermissions,
  updateRolePermissions,
} = require("../controllers/rolePermissionController.js");

router.get("/rolePermissions/:id", getRolePermissions);
router.put("/rolePermissions/:id", updateRolePermissions);

// Branch Routes
router.post("/BranchReg", createBranch);
router.post("/BranchLogin", branchLogIn);
router.get("/Branches/:mainSchoolId", getBranches);
router.get("/Branch/:id", getBranchDetail);
router.get("/BranchStats/:branchId", getBranchStats);
router.get("/BranchStudents/:branchId", getBranchStudents);
router.get("/BranchTeachers/:branchId", getBranchTeachers);
router.get("/BranchSubjects/:branchId", getBranchSubjects);
router.put("/Branch/:id", updateBranch);
router.delete("/Branch/:id", deleteBranch);

// Library Store Inventory Routes
const {
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
} = require("../controllers/libraryStoreController.js");

// Vendor routes
router.post("/LibraryStore/Vendor", createVendor);
router.get("/LibraryStore/Vendors/:schoolId", getVendors);
router.put("/LibraryStore/Vendor/:id", updateVendor);
router.delete("/LibraryStore/Vendor/:id", deleteVendor);

// Book Purchase routes
router.post("/LibraryStore/Purchase", createBookPurchase);
router.get("/LibraryStore/Purchases/:schoolId", getBookPurchases);

// Book Sale routes
router.post("/LibraryStore/Sale", createBookSale);
router.get("/LibraryStore/Sales/:schoolId", getBookSales);

// Inventory routes
router.get("/LibraryStore/Inventory/:schoolId", getInventory);

// Report routes
router.get("/LibraryStore/VendorReport/:vendorId", getVendorPurchaseReport);
router.get("/LibraryStore/StudentReport/:studentId", getStudentSalesReport);
router.get("/LibraryStore/SalesReport/:schoolId", getSalesReport);

// Fee Structure routes
router.post("/FeeStructure", createFeeStructure);
router.get("/FeeStructures/:schoolId", getFeeStructures);
router.get("/FeeStructure/:classId/:schoolId", getFeeStructureByClass);
router.put("/FeeStructure/:id", updateFeeStructure);
router.delete("/FeeStructure/:id", deleteFeeStructure);

//Upload Assignment

//paperRoutes

module.exports = router;
