const SchoolDetails = require("../models/schoolDetailsModel");

async function insertSchoolDetails(req, res) {
  try {
    const data = await SchoolDetails.create(req.body);
    res
      .status(201)
      .json({ data: data, ok: true, message: "Data inserted successfully" });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

async function getSingleSchoolDetails(req, res) {
  const id = req.params.id;
  console.log(id);
  try {
    const data = await SchoolDetails.findOne({ principal: id });
    if (!data) {
      res
        .status(404)
        .json({ msg: "School details not found for the provided ID" });
      return;
    }
    res.status(200).json({ data: data, msg: "School details found" });
  } catch (error) {
    console.error("Error fetching school details:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

module.exports = {
  insertSchoolDetails,
  getSingleSchoolDetails,
};
