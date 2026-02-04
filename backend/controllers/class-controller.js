const mongoose = require("mongoose");
const Sclass = require("../models/sclassSchema.js");
const Student = require("../models/studentSchema.js");
const Subject = require("../models/subjectSchema.js");
const Teacher = require("../models/teacherSchema.js");

const sclassCreate = async (req, res) => {
  try {
    const sclass = new Sclass({
      sclassName: req.body.sclassName,
      sclassSection: req.body.sclassSection,
      school: req.body.school,
    });

    const existingSclassByName = await Sclass.findOne({
      sclassName: req.body.sclassName,
      sclassSection: req.body.sclassSection,
      school: req.body.adminID,
    });

    if (existingSclassByName) {
      res.send({ message: "Sorry this class name already exists" });
    } else {
      const result = await sclass.save();
      res.send(result);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const sclassList = async (req, res) => {
  try {
    let sclasses = await Sclass.find({ school: req.params.id });
    if (sclasses.length > 0) {
      res.send(sclasses);
    } else {
      res.send({ message: "No sclasses found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getSclassDetail = async (req, res) => {
  try {
    let sclass = await Sclass.findById(req.params.id);
    if (sclass) {
      sclass = await sclass.populate("school", "schoolName");
      res.send(sclass);
    } else {
      res.send({ message: "No class found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getSclassStudents = async (req, res) => {
  try {
    let classId = req.params.id;
    
    // Check if the parameter is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(classId);
    
    let students;
    if (isValidObjectId) {
      // If it's an ObjectId, use it directly
      students = await Student.find({ sclassName: classId }).populate(
        "feeDetails"
      );
    } else {
      // If it's a string (class name), find the class first
      const sclass = await Sclass.findOne({ sclassName: classId });
      if (!sclass) {
        return res.send({ message: "Class not found" });
      }
      students = await Student.find({ sclassName: sclass._id }).populate(
        "feeDetails"
      );
    }
    
    if (students.length > 0) {
      let modifiedStudents = students.map((student) => {
        return { ...student._doc, password: undefined };
      });
      res.send(modifiedStudents);
    } else {
      res.send({ message: "No students found" });
    }
  } catch (err) {
    console.error("Error in getSclassStudents:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteSclass = async (req, res) => {
  try {
    const deletedClass = await Sclass.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.send({ message: "Class not found" });
    }
    const deletedStudents = await Student.deleteMany({
      sclassName: req.params.id,
    });
    const deletedSubjects = await Subject.deleteMany({
      sclassName: req.params.id,
    });
    const deletedTeachers = await Teacher.deleteMany({
      teachSclass: req.params.id,
    });
    res.send(deletedClass);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteSclasses = async (req, res) => {
  try {
    const deletedClasses = await Sclass.deleteMany({ school: req.params.id });
    if (deletedClasses.deletedCount === 0) {
      return res.send({ message: "No classes found to delete" });
    }
    const deletedStudents = await Student.deleteMany({ school: req.params.id });
    const deletedSubjects = await Subject.deleteMany({ school: req.params.id });
    const deletedTeachers = await Teacher.deleteMany({ school: req.params.id });
    res.send(deletedClasses);
  } catch (error) {
    res.status(500).json(error);
  }
};

//Get Section
async function getClassBySection(req, res) {
  console.log("in Cont");
  console.log("in getClass");
  const school = req.body.school;
  const sclassName = req.body.sclassName;
  console.log(school, sclassName);
  try {
    const data = await Sclass.find({ school: school, sclassName: sclassName });
    if (data) {
      console.log(data);
    }
    res.status(200).json({ data: data, ok: true, message: "Data Found!" });
  } catch (err) {
    res.status(400).json({ ok: false, msg: "error" });
  }
}

module.exports = {
  sclassCreate,
  sclassList,
  deleteSclass,
  deleteSclasses,
  getSclassDetail,
  getSclassStudents,
  getClassBySection,
};
