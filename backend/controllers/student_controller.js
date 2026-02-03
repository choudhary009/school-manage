const bcrypt = require("bcrypt");
const Student = require("../models/studentSchema.js");
const Subject = require("../models/subjectSchema.js");

const studentRegister = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    console.log(req.body);

    const existingStudent = await Student.findOne({
      rollNum: req.body.rollNum,
      school: req.body.adminID,
      sclassName: req.body.sclassName,
    });

    if (existingStudent) {
      res.send({ message: "Roll Number already exists" });
      console.log("in roll number");
    } else {
      console.log("in try");
      const student = new Student({
        ...req.body,
        password: hashedPass,
      });

      console.log("saving data");
      let result = await student.save();

      result.password = undefined;
      res
        .status(200)
        .json({ data: result, ok: true, message: "Successfully registered" });
    }
  } catch (err) {
    res.status(500).json(err);
    console.log("in catch");
  }
};

const studentLogIn = async (req, res) => {
  try {
    console.log("Student login attempt:", {
      email: req.body.email,
      rollNum: req.body.rollNum,
      studentName: req.body.studentName,
      hasPassword: !!req.body.password
    });
    
    let student;
    
    // Try email login first if email is provided
    if (req.body.email && req.body.email.trim() !== "") {
      const email = req.body.email.trim().toLowerCase();
      student = await Student.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive email match
      });
      console.log("Email login - Student found:", !!student);
    } 
    // Fallback to rollNum and name login
    else if (req.body.rollNum && req.body.studentName) {
      const rollNum = req.body.rollNum.toString().trim();
      const studentName = req.body.studentName.trim();
      
      student = await Student.findOne({
        rollNum: rollNum,
        name: { $regex: new RegExp(`^${studentName}$`, 'i') } // Case-insensitive name match
      });
      console.log("RollNum + Name login - Student found:", !!student, {
        searchedRollNum: rollNum,
        searchedName: studentName
      });
    }
    
    if (!student) {
      console.log("Student not found in database");
      return res.send({ message: "Student not found" });
    }
    
    console.log("Student found, validating password. Student ID:", student._id);
    
    if (!student.password) {
      console.log("Student has no password set");
      return res.send({ message: "Password not set for this student" });
    }
    
    const validated = await bcrypt.compare(
      req.body.password,
      student.password
    );
    
    console.log("Password validation result:", validated);
    
    if (validated) {
      student = await student.populate("school", "schoolName");
      student = await student.populate("sclassName", "sclassName sclassSection");
      student.password = undefined;
      student.examResult = undefined;
      student.attendance = undefined;
      console.log("Login successful for student:", student._id);
      res.send(student);
    } else {
      console.log("Invalid password for student:", student._id);
      res.send({ message: "Invalid password" });
    }
  } catch (err) {
    console.error("Error in student login:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

const getStudents = async (req, res) => {
  try {
    let students = await Student.find({ school: req.params.id }).populate(
      "sclassName",
      "sclassName"
    );
    if (students.length > 0) {
      let modifiedStudents = students.map((student) => {
        return { ...student._doc, password: undefined };
      });
      res.send(modifiedStudents);
    } else {
      res.send({ message: "No students found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudentDetail = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id)
      .populate("school", "schoolName")
      .populate("sclassName", "sclassName sclassSection")
      .populate("examResult.subjectId", "subName")
      .populate("attendance.subName", "subName sessions")
      .select("+email"); // Explicitly include email field
    if (student) {
      student.password = undefined;
      // Convert to plain object to ensure all fields including email are included
      const studentObj = student.toObject ? student.toObject() : student;
      res.send(studentObj);
    } else {
      res.status(404).json({ message: "No student found" });
    }
  } catch (err) {
    console.error("Error fetching student detail:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const result = await Student.findByIdAndDelete(req.params.id);
    res.send(result);
  } catch (error) {
    res.status(500).json(err);
  }
};

const deleteStudents = async (req, res) => {
  try {
    const result = await Student.deleteMany({ school: req.params.id });
    if (result.deletedCount === 0) {
      res.send({ message: "No students found to delete" });
    } else {
      res.send(result);
    }
  } catch (error) {
    res.status(500).json(err);
  }
};

const deleteStudentsByClass = async (req, res) => {
  try {
    const result = await Student.deleteMany({ sclassName: req.params.id });
    if (result.deletedCount === 0) {
      res.send({ message: "No students found to delete" });
    } else {
      res.send(result);
    }
  } catch (error) {
    res.status(500).json(err);
  }
};

const updateStudent = async (req, res) => {
  try {
    console.log("Update student request body:", req.body);
    
    // Get existing student first to preserve fields
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Existing student:", {
      _id: existingStudent._id,
      name: existingStudent.name,
      email: existingStudent.email,
      rollNum: existingStudent.rollNum,
      hasPassword: !!existingStudent.password
    });
    
    const updateData = {};
    
    // Only update fields that are provided and not empty
    const fieldsToUpdate = [
      'name', 'email', 'mobilePhone', 'rollNum', 'sclassName', 'school', 'gender',
      'dateOfBirth', 'weight', 'height', 'fatherName', 'fatherOccupation',
      'address', 'bloodGroup', 'nationality', 'religion', 'studentImage'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        // For string fields, only update if not empty after trim
        if (typeof req.body[field] === 'string') {
          const trimmed = req.body[field].trim();
          if (trimmed !== '') {
            updateData[field] = trimmed;
          }
        } else {
          // For non-string fields (like ObjectId), update as is
          updateData[field] = req.body[field];
        }
      }
    });
    
    // Hash password if provided
    if (req.body.password && req.body.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
      console.log("Password will be updated (hashed)");
    } else {
      // Don't include password in update - keep existing password
      console.log("Password will not be updated (keeping existing)");
    }
    
    console.log("Update data:", { ...updateData, password: updateData.password ? "***" : "not included" });
    
    let result = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate("school", "schoolName")
      .populate("sclassName", "sclassName sclassSection");

    if (!result) {
      return res.status(404).json({ message: "Student not found after update" });
    }

    result.password = undefined;
    console.log("Student updated successfully:", {
      _id: result._id,
      name: result.name,
      email: result.email,
      rollNum: result.rollNum
    });
    res.send(result);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const updateExamResult = async (req, res) => {
  const { subName, marksObtained } = req.body;

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.send({ message: "Student not found" });
    }

    const existingResult = student.examResult.find(
      (result) => result.subName.toString() === subName
    );

    if (existingResult) {
      existingResult.marksObtained = marksObtained;
    } else {
      student.examResult.push({ subName, marksObtained });
    }

    const result = await student.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const studentAttendance = async (req, res) => {
  const { subName, status, date } = req.body;

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.send({ message: "Student not found" });
    }

    const subject = await Subject.findById(subName);

    const existingAttendance = student.attendance.find(
      (a) =>
        a.date.toDateString() === new Date(date).toDateString() &&
        a.subName.toString() === subName
    );

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      // Check if the student has already attended the maximum number of sessions
      const attendedSessions = student.attendance.filter(
        (a) => a.subName.toString() === subName
      ).length;

      if (attendedSessions >= subject.sessions) {
        return res.send({ message: "Maximum attendance limit reached" });
      }

      student.attendance.push({ date, status, subName });
    }

    const result = await student.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const clearAllStudentsAttendanceBySubject = async (req, res) => {
  const subName = req.params.id;

  try {
    const result = await Student.updateMany(
      { "attendance.subName": subName },
      { $pull: { attendance: { subName } } }
    );
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const clearAllStudentsAttendance = async (req, res) => {
  const schoolId = req.params.id;

  try {
    const result = await Student.updateMany(
      { school: schoolId },
      { $set: { attendance: [] } }
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const removeStudentAttendanceBySubject = async (req, res) => {
  const studentId = req.params.id;
  const subName = req.body.subId;

  try {
    const result = await Student.updateOne(
      { _id: studentId },
      { $pull: { attendance: { subName: subName } } }
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const removeStudentAttendance = async (req, res) => {
  const studentId = req.params.id;

  try {
    const result = await Student.updateOne(
      { _id: studentId },
      { $set: { attendance: [] } }
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

//Attendance for  all students in a class by subject
const getClassStudentsAttendance = async (req, res) => {
  const { classId } = req.params; // Assuming classId is sent as a URL parameter
  try {
    const data = await Student.find({ sclassName: classId }).populate({
      path: "attendance.subName", // Adjust the path to access the subName field in the attendance array
      model: "subject", // Change "subject" to the actual model name of your Subject model
      select: "subName", // Select the field to populate
    });
    res
      .status(200)
      .json({ ok: true, data: data, message: "Data fetched successfully" });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
};

//Mark all student attendance
async function markAllStudentAttendance(req, res) {
  const attendanceArray = req.body.attendanceArray;
  console.log(attendanceArray);
  let updatedItems = [];
  try {
    for (const item of attendanceArray) {
      try {
        const student = await Student.findById(item.id);
        if (!student) {
          console.error(`Student with ID ${item.id} not found`);
          continue;
        }

        // Check if attendance already exists for this date and subject
        const attendanceDate = new Date(item.date);
        const existingIndex = student.attendance.findIndex(
          (a) =>
            a.subName.toString() === item.subject &&
            new Date(a.date).toDateString() === attendanceDate.toDateString()
        );

        if (existingIndex !== -1) {
          // Update existing attendance
          student.attendance[existingIndex].status = item.status;
          student.attendance[existingIndex].date = item.date;
        } else {
          // Add new attendance
          student.attendance.push({
            date: item.date,
            status: item.status,
            subName: item.subject,
          });
        }

        const updatedItem = await student.save();
        updatedItems.push(updatedItem);
        console.log(`Attendance updated for student with ID ${item.id}`);
      } catch (error) {
        console.error(
          `Error updating attendance for student with ID ${item.id}:`,
          error
        );
      }
    }
    res.status(201).json({
      ok: true,
      data: updatedItems,
      message: "Attendance marked Successfully!",
    });
  } catch (error) {
    console.error("Error in markAllStudentAttendance:", error);
    res.status(500).json({
      ok: false,
      message: "Internal Server Error",
    });
  }
}

async function getStudentAttendanceBySubject(req, res) {
  const { school, sclassName, subject } = req.body;
  console.log("in the getstudent api");
  // console.log(req);
  console.log(sclassName, subject, school);
  let subid;
  // let student;
  let studentDetails = [];
  try {
    const data = await Student.find({ sclassName, school }).select(
      "-studentImage"
    );
    // console.log(data);
    data.map((item) => {
      subid = item.attendance.filter((sub) => {
        if (sub.subName == subject) {
          // console.log(`sub ${sub} subName${sub.subName} Subject${subject}`);
          // console.log("subId", subid);
          if (sub) {
            // console.log(sub);
            return sub;
          }
        }
      });
      item.attendance = subid;
    });
    console.log("subid ", data);
    // console.log("Data Cosole", data[1].attendance);
    // console.log(subid);
    // console.log(student);
    // data.map((item) => {
    //   // console.log(subid);
    //   const obj = {
    //     name: item.name,
    //     rollNo: item.rollNum,
    //     attendance: subid,
    //   };
    //   studentDetails.push(obj);
    // });
    // console.log(studen);
    res.status(200).json({
      ok: true,
      data: data,
      message: "Data fetched successfully",
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

module.exports = {
  studentRegister,
  studentLogIn,
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
};
