const express = require("express");
const {
  createPaper,
  getPaperBySubjectTeacher,
  makeQuestionPaper,
  getCLassAssignments,
  saveAssignmentAnswer,
  uploadStudentMarks,
  generateReportCard,
  generateMarkSheet,
} = require("../controllers/paperController");
const router = express.Router();

router.post("/create", createPaper);
router.post("/getTeacherPaper", getPaperBySubjectTeacher);
router.post("/makeQuestionPaper", makeQuestionPaper);
router.post("/classAssignments", getCLassAssignments);
router.put("/saveAnswer", saveAssignmentAnswer);
router.post("/uploadMarks", uploadStudentMarks);
router.post("/generateReportCard", generateReportCard);
router.post("/generateMarkSheet", generateMarkSheet);

module.exports = router;
