const express = require("express");
const router = express.Router();

const {
  insertSchoolDetails,
  getSingleSchoolDetails,
} = require("../controllers/schoolDetailsController.js");

router.post("/create", insertSchoolDetails);
router.get("/:id", getSingleSchoolDetails);

module.exports = router;
