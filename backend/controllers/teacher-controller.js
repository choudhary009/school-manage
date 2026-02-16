const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Teacher = require("../models/teacherSchema.js");
const Subject = require("../models/subjectSchema.js");

const teacherRegister = async (req, res) => {
  console.log(req.body);
  const {
    name,
    email,
    password,
    school,
    qualifications,
    experience,
    teacherImage,
    cvImage,
    teachSubjects,
    teachSclasses,
  } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPass,
      school,
      qualifications,
      experience,
      teacherImage,
      cvImage,
      teachSubjects,
      teachSclasses,
    });

    const existingTeacherByEmail = await Teacher.findOne({ email });

    if (existingTeacherByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let data = await teacher.save();

    return res.status(201).json({ data: data, ok: true, msg: "added" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// const teacherRegister = async (req, res) => {
//     const { name, email, password, role, school, teachSubject, teachSclass } = req.body;
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hashedPass = await bcrypt.hash(password, salt);

//         const teacher = new Teacher({ name, email, password: hashedPass, role, school, teachSubject, teachSclass });

//         const existingTeacherByEmail = await Teacher.findOne({ email });

//         if (existingTeacherByEmail) {
//             res.send({ message: 'Email already exists' });
//         }
//         else {
//             let result = await teacher.save();
//             await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id });
//             result.password = undefined;
//             res.send(result);
//         }
//     } catch (err) {
//         res.status(500).json(err);
//     }
// };

const teacherLogIn = async (req, res) => {
  try {
    let teacher = await Teacher.findOne({ email: req.body.email })
      .populate("teachSubjects")
      .populate("teachSclasses")
      .populate("school")
      .exec();

    console.log(teacher);

    if (teacher) {
      const validated = await bcrypt.compare(
        req.body.password,
        teacher.password
      );
      if (validated) {
        // Remove password before sending teacher data
        teacher.password = undefined;

        // Send populated teacher data
        res.send(teacher);
      } else {
        res.send({ message: "Invalid password" });
      }
    } else {
      res.send({ message: "Teacher not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeachers = async (req, res) => {
  console.log(req.params.id);
  console.log("called");
  try {
    let teachers = await Teacher.find({ school: req.params.id })
      .populate({
        path: "teachSubjects",
        select: "subName sclassName",
        populate: {
          path: "sclassName",
          select: "sclassName sclassSection",
        },
      })
      .populate("teachSclasses", "sclassName sclassSection")
      .select("-cv -password -teacherImage");
    console.log(teachers);
    if (teachers.length > 0) {
      let modifiedTeachers = teachers.map((teacher) => {
        const obj = teacher.toObject ? teacher.toObject() : { ...teacher._doc };
        obj.password = undefined;
        return obj;
      });
      res.send(modifiedTeachers);
    } else {
      res.send({ message: "No teachers found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeacherDetail = async (req, res) => {
  try {
    const teacherId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID format", ok: false });
    }

    let teacher = await Teacher.findById(teacherId)
      .populate("teachSubjects", "subName sessions")
      .populate("school", "schoolName")
      .populate("teachSclasses", "sclassName sclassSection");

    if (teacher) {
      teacher.password = undefined;
      res.send(teacher);
    } else {
      res.send({ message: "No teacher found" });
    }
  } catch (err) {
    console.error("getTeacherDetail error:", err);
    res.status(500).json(err);
  }
};

const updateTeacher = async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    const teacherId = req.params.id;
    let oldTeacher = null;
    if (Array.isArray(req.body.teachSubjects)) {
      oldTeacher = await Teacher.findById(teacherId).select("teachSubjects").lean();
    }
    let result = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: req.body },
      { new: true }
    )
      .populate("teachSubjects")
      .populate("teachSclasses")
      .populate("school")
      .exec();

    result.password = undefined;

    if (Array.isArray(req.body.teachSubjects)) {
      const newIds = (req.body.teachSubjects || []).map((id) => id.toString?.() || id);
      const oldIds = (oldTeacher?.teachSubjects || []).map((id) => id.toString?.());
      const removedIds = oldIds.filter((id) => !newIds.includes(id));
      if (removedIds.length > 0) {
        await Subject.updateMany(
          { _id: { $in: removedIds } },
          { $unset: { teacher: 1 } }
        );
      }
    }
    res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateTeacherSubject = async (req, res) => {
  const { teacherId, teachSubject, sclassId } = req.body;
  console.log("PUT /TeacherSubject called", { teacherId, teachSubject, sclassId });
  if (!teacherId || !teachSubject) {
    return res.status(400).json({
      message: "Missing teacherId or teachSubject",
      ok: false,
    });
  }
  try {
    const teacherExists = await Teacher.findById(teacherId);
    if (!teacherExists) {
      return res.status(404).json({ message: "Teacher not found", ok: false });
    }
    const subjectExists = await Subject.findById(teachSubject);
    if (!subjectExists) {
      return res.status(404).json({ message: "Subject not found", ok: false });
    }

    const addToSet = { teachSubjects: teachSubject };
    if (sclassId && typeof sclassId === "string" && sclassId.trim()) {
      addToSet.teachSclasses = sclassId.trim();
    }
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $addToSet: addToSet },
      { new: true }
    )
      .populate({
        path: "teachSubjects",
        select: "subName sclassName",
        populate: {
          path: "sclassName",
          select: "sclassName sclassSection",
        },
      })
      .populate("teachSclasses", "sclassName sclassSection");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found", ok: false });
    }

    await Subject.findByIdAndUpdate(teachSubject, {
      teacher: updatedTeacher._id,
    });

    return res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error("updateTeacherSubject error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update teacher subject",
      ok: false,
    });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

    await Subject.updateOne(
      { teacher: deletedTeacher._id, teacher: { $exists: true } },
      { $unset: { teacher: 1 } }
    );

    res.send(deletedTeacher);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteTeachers = async (req, res) => {
  try {
    const deletionResult = await Teacher.deleteMany({ school: req.params.id });

    const deletedCount = deletionResult.deletedCount || 0;

    if (deletedCount === 0) {
      res.send({ message: "No teachers found to delete" });
      return;
    }

    const deletedTeachers = await Teacher.find({ school: req.params.id });

    await Subject.updateMany(
      {
        teacher: { $in: deletedTeachers.map((teacher) => teacher._id) },
        teacher: { $exists: true },
      },
      { $unset: { teacher: "" }, $unset: { teacher: null } }
    );

    res.send(deletionResult);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteTeachersByClass = async (req, res) => {
  try {
    const deletionResult = await Teacher.deleteMany({
      sclassName: req.params.id,
    });

    const deletedCount = deletionResult.deletedCount || 0;

    if (deletedCount === 0) {
      res.send({ message: "No teachers found to delete" });
      return;
    }

    const deletedTeachers = await Teacher.find({ sclassName: req.params.id });

    await Subject.updateMany(
      {
        teacher: { $in: deletedTeachers.map((teacher) => teacher._id) },
        teacher: { $exists: true },
      },
      { $unset: { teacher: "" }, $unset: { teacher: null } }
    );

    res.send(deletionResult);
  } catch (error) {
    res.status(500).json(error);
  }
};

const teacherAttendance = async (req, res) => {
  const { status, date } = req.body;

  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.send({ message: "Teacher not found" });
    }

    const inputDate = new Date(date);
    const dateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    const existingAttendanceIndex = teacher.attendance.findIndex(
      (a) => {
        const aDate = new Date(a.date);
        return aDate.getFullYear() === dateOnly.getFullYear() &&
          aDate.getMonth() === dateOnly.getMonth() &&
          aDate.getDate() === dateOnly.getDate();
      }
    );

    if (existingAttendanceIndex !== -1) {
      teacher.attendance[existingAttendanceIndex].status = status;
      teacher.attendance[existingAttendanceIndex].date = dateOnly;
    } else {
      teacher.attendance.push({ date: dateOnly, status });
    }

    const result = await teacher.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

async function filterTeacherClassSubjects(req, res) {
  const sclassName = req.params.id;
  try {
    const data = await Subject.find({ sclassName });
    res.status(200).json({
      data: data,
      ok: true,
      message: "Successfully Filtered Class Data!",
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
}

const submitTeacherRating = async (req, res) => {
  const { studentId, rating, comment } = req.body;
  const teacherId = req.params.id;

  try {
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if student has already rated this teacher
    const existingRatingIndex = teacher.ratings.findIndex(
      (r) => r.student.toString() === studentId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      teacher.ratings[existingRatingIndex].rating = rating;
      teacher.ratings[existingRatingIndex].comment = comment;
      teacher.ratings[existingRatingIndex].date = Date.now();
    } else {
      // Add new rating
      teacher.ratings.push({
        student: studentId,
        rating,
        comment,
      });
    }

    const result = await teacher.save();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json(error);
  }
};

module.exports = {
  teacherRegister,
  teacherLogIn,
  getTeachers,
  getTeacherDetail,
  updateTeacher,
  updateTeacherSubject,
  deleteTeacher,
  deleteTeachers,
  deleteTeachersByClass,
  teacherAttendance,
  filterTeacherClassSubjects,
  submitTeacherRating,
};
