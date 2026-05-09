const express = require("express");
const router = express.Router();

const {
  setFeeDetails,
  getAllFeeDetails,
  setFeeDetailsByMonth,
  updateFeeDetails,
  saveFeeStatus,
} = require("../controllers/feeDetailsController");

router.post("/", setFeeDetails);
router.post("/get", getAllFeeDetails);
router.post("/setByMonth", setFeeDetailsByMonth);
router.put("/update/:id", updateFeeDetails);
router.put("/saveFeeStatus", saveFeeStatus);

module.exports = router;
