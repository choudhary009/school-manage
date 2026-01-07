const express = require("express");
const {
  createPaper,
  getPaperBySubjectTeacher,
  getPaperById,
  getPaperImage,
  updatePaper,
  deletePaper,
  makeQuestionPaper,
  getCLassAssignments,
  getClassPapers,
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
router.post("/classPapers", getClassPapers); // New endpoint for student exam papers (midterm/final)
router.put("/saveAnswer", saveAssignmentAnswer);
router.post("/uploadMarks", uploadStudentMarks);
router.post("/generateReportCard", generateReportCard);
router.post("/generateMarkSheet", generateMarkSheet);
router.get("/:paperId/image", getPaperImage); // Get only image (faster - must be before /:paperId)
router.put("/:paperId", updatePaper); // Update paper
router.delete("/:paperId", deletePaper); // Delete paper
router.get("/:paperId", getPaperById); // Get individual paper with image (must be last to avoid route conflicts)

module.exports = router;
