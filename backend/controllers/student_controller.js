const bcrypt = require("bcrypt");
const Student = require("../models/studentSchema.js");
const Subject = require("../models/subjectSchema.js");

const getNextRegisterNumber = async (schoolId) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `CSS-${year}_`;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = new RegExp(`^${escapedPrefix}\\d+$`);

    const students = await Student.find({
      school: schoolId,
      registerNumber: {
        $exists: true,
        $ne: null,
        $regex: regexPattern
      },
    })
      .select("registerNumber")
      .lean();

    let max = 0;
    students.forEach((s) => {
      if (s && s.registerNumber && typeof s.registerNumber === 'string') {
        const num = parseInt(s.registerNumber.replace(prefix, ""), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return `${prefix}${max + 1}`;
  } catch (error) {
    console.error("Error in getNextRegisterNumber:", error);
    throw error;
  }
};

const getNextRegisterNumberHandler = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "School ID is required" });
    }
    const registerNumber = await getNextRegisterNumber(req.params.id);
    res.json({ registerNumber });
  } catch (err) {
    console.error("Error in getNextRegisterNumberHandler:", err);
    res.status(500).json({ message: err.message || "Failed to get next register number" });
  }
};

const studentRegister = async (req, res) => {
  try {

    const schoolId = req.body.school || req.body.adminID;
    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    let registerNumber = req.body.registerNumber;
    if (!registerNumber) {
      try {
        registerNumber = await getNextRegisterNumber(schoolId);
        req.body.registerNumber = registerNumber;
      } catch (err) {
        console.error("Error generating register number:", err);
        return res.status(500).json({ message: "Failed to generate register number" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    // If password is not provided, use a default "123456"
    const passwordToHash = req.body.password && req.body.password.trim() !== "" ? req.body.password : "123456";
    const hashedPass = await bcrypt.hash(passwordToHash, salt);

    // Clean up empty strings - convert to undefined for optional fields to avoid CastErrors
    const cleanedBody = { ...req.body };
    const allFields = Object.keys(cleanedBody);

    allFields.forEach(field => {
      if (cleanedBody[field] === '' || cleanedBody[field] === null) {
        cleanedBody[field] = undefined;
      }
    });

    // Provide defaults instead of returning 400
    if (!cleanedBody.name || cleanedBody.name.trim() === '') {
      cleanedBody.name = "New Student";
    }

    // Default Roll Number if missing or invalid
    let rollNumValue = cleanedBody.rollNum;
    if (rollNumValue === undefined || rollNumValue === null || rollNumValue === '' || isNaN(parseInt(rollNumValue, 10))) {
      // Generate a unique-ish roll number based on timestamp if missing
      rollNumValue = Math.floor(Date.now() / 1000) % 10000;
      cleanedBody.rollNum = rollNumValue;
    } else {
      rollNumValue = parseInt(rollNumValue, 10);
    }

    // Convert dateOfBirth to Date object if it's a string
    let dateOfBirth = cleanedBody.dateOfBirth;
    if (dateOfBirth && typeof dateOfBirth === 'string') {
      dateOfBirth = new Date(dateOfBirth);
      if (isNaN(dateOfBirth.getTime())) {
        dateOfBirth = new Date('2000-01-01');
      }
    } else if (!dateOfBirth) {
      dateOfBirth = new Date('2000-01-01');
    }

    // Provide defaults for schema-required fields that can have defaults
    const studentData = {
      ...cleanedBody,
      rollNum: rollNumValue,
      gender: cleanedBody.gender || 'Male',
      dateOfBirth: dateOfBirth,
      address: cleanedBody.address || cleanedBody.city || 'Not provided',
      bloodGroup: cleanedBody.bloodGroup || 'Not specified',
      nationality: cleanedBody.nationality || 'Not specified',
      religion: cleanedBody.religion || 'Not specified',
      fatherName: cleanedBody.fatherName || 'Not provided',
      school: schoolId,
    };

    console.log("Student data to save:", { ...studentData, password: '***' });

    const existingStudent = await Student.findOne({
      rollNum: cleanedBody.rollNum,
      school: schoolId,
      sclassName: cleanedBody.sclassName,
    });

    // Previously, duplicate roll numbers in same class+school caused 400 error.
    // As per latest requirement ("sab fields optional, no hard errors"),
    // we now allow creating another student even if a duplicate is found.
    if (existingStudent) {
      console.warn(
        "studentRegister: Roll Number already exists for this class & school. " +
        "Proceeding to create another student record with same roll number."
      );
    }

    console.log("Creating new student");
    const student = new Student({
      ...studentData,
      password: hashedPass,
    });

    console.log("saving data");
    let result = await student.save();

    result.password = undefined;
    res
      .status(200)
      .json({ data: result, ok: true, message: "Successfully registered" });
  } catch (err) {
    console.error("Error in studentRegister:", err);
    const errorMessage = err.message || "Internal server error";
    const errorDetails = err.errors ? Object.values(err.errors).map(e => e.message).join(", ") : errorMessage;
    res.status(500).json({
      message: errorDetails,
      error: errorMessage
    });
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
      "sclassName sclassSection"
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
      .populate("feeDetails")
      .populate("examResult.subjectId", "subName")
      .populate("attendance.subName", "subName sessions")
      .select("+email +mobilePhone"); // Explicitly include email and mobilePhone fields
    if (student) {
      student.password = undefined;
      // Convert to plain object to ensure all fields including email and mobilePhone are included
      const studentObj = student.toObject ? student.toObject() : student;
      console.log("Student detail fetched - Email:", studentObj.email, "MobilePhone:", studentObj.mobilePhone);
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
      'name', 'email', 'mobilePhone', 'rollNum', 'registerNumber', 'sclassName', 'school', 'gender',
      'dateOfBirth', 'weight', 'height', 'fatherName', 'fatherOccupation',
      'address', 'bloodGroup', 'nationality', 'religion', 'studentImage', 'discount',
      'whatsappNumber', 'studentCNIC', 'fatherContactNumber', 'fatherCNIC', 'motherContactNumber', 'motherCNIC',
      'street', 'houseNumber', 'city', 'admissionDate', 'session'
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
          (a) => {
            const attSubId = a.subName ? a.subName.toString() : null;
            const itemSubId = item.subject ? item.subject.toString() : null;
            return (
              attSubId === itemSubId &&
              new Date(a.date).toDateString() === attendanceDate.toDateString()
            );
          }
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
  console.log(`Fetching attendance for Class: ${sclassName}, Subject: ${subject}`);
  let subid;
  let studentDetails = [];
  try {
    const data = await Student.find({ sclassName, school }).select(
      "-studentImage"
    ).lean();

    data.forEach((item) => {
      const attendanceArray = Array.isArray(item.attendance) ? item.attendance : [];
      const filteredAttendance = attendanceArray.filter((att) => {
        const attSubName = att.subName ? att.subName.toString() : null;
        const targetSub = subject ? subject.toString() : null;
        return attSubName === targetSub;
      });
      item.attendance = filteredAttendance;
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
};
