const bcrypt = require("bcrypt");
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
      .populate("teachSubjects", "subName")
      .populate({ path: "teachSclasses", select: "sclassName sclassSection" })
      .select("-cv  -password -teacherImage");
    console.log(teachers);
    if (teachers.length > 0) {
      let modifiedTeachers = teachers.map((teacher) => {
        return { ...teacher._doc, password: undefined };
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
    let teacher = await Teacher.findById(req.params.id)
      .populate("teachSubject", "subName sessions")
      .populate("school", "schoolName")
      .populate("teachSclass", "sclassName");
    if (teacher) {
      teacher.password = undefined;
      res.send(teacher);
    } else {
      res.send({ message: "No teacher found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateTeacher = async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    let result = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
      .populate("teachSubjects")
      .populate("teachSclasses")
      .populate("school")
      .exec();

    result.password = undefined;
    res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateTeacherSubject = async (req, res) => {
  const { teacherId, teachSubject } = req.body;
  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { teachSubject },
      { new: true }
    );

    await Subject.findByIdAndUpdate(teachSubject, {
      teacher: updatedTeacher._id,
    });

    res.send(updatedTeacher);
  } catch (error) {
    res.status(500).json(error);
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

    const existingAttendance = teacher.attendance.find(
      (a) => a.date.toDateString() === new Date(date).toDateString()
    );

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      teacher.attendance.push({ date, status });
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
};
