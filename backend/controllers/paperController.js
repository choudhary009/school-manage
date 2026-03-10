const Paper = require("../models/paperSchema");
const Student = require("../models/studentSchema");

async function createPaper(req, res) {
  console.log("Received paper data:", {
    ...req.body,
    paper: req.body.paper ? "Image present" : "No image",
  });

  try {
    // Validate required fields
    if (!req.body.title || !req.body.school || !req.body.teacherId || !req.body.sclass || !req.body.subject || !req.body.paperType || !req.body.totalMarks) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: title, school, teacherId, sclass, subject, paperType, and totalMarks are required"
      });
    }

    const data = await Paper.createPaper(req.body);
    console.log("Paper created successfully:", data._id);
    res
      .status(200)
      .json({ data: data, ok: true, message: "Created Successfully" });
  } catch (error) {
    console.error("Error creating paper:", error);
    res.status(400).json({ ok: false, message: error.message });
  }
}

async function getPaperBySubjectTeacher(req, res) {
  const { teacherId, sclass, subject, paperType } = req.body;

  let query = {};

  if (teacherId) {
    query.teacherId = teacherId;
  }
  if (sclass) {
    query.sclass = sclass;
  }
  if (subject) {
    query.subject = subject;
  }

  // Filter by paperType on backend if provided (array or single value)
  if (paperType) {
    if (Array.isArray(paperType)) {
      query.paperType = { $in: paperType };
    } else {
      query.paperType = paperType;
    }
  }

  try {
    // Exclude 'paper' field (base64 image) for list view - huge performance improvement
    // Base64 images can be several MBs, excluding them makes queries 10-100x faster
    // Add limit to prevent fetching too many records at once
    const limit = parseInt(req.body.limit) || 50; // Default limit of 50, can be increased if needed

    const data = await Paper.find(query)
      .select("-paper -questions") // Exclude large fields (use -fieldName to exclude)
      .populate("subject", "subName")
      .populate("sclass", "sclassName sclassSection")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(); // Use lean() for faster queries (returns plain JS objects, not Mongoose docs)

    console.log(`Found ${data.length} papers (optimized - images excluded, limit: ${limit})`);
    res.status(200).json({ data: data, ok: true, msg: "Data Fetched" });
  } catch (error) {
    console.error("Error fetching papers:", error);
    res.status(400).json({ ok: false, msg: error.message });
  }
}

// New endpoint to fetch individual assignment with image (for viewing details)
async function getPaperById(req, res) {
  const { paperId } = req.params;

  try {
    const paper = await Paper.findById(paperId)
      .populate("subject", "subName")
      .populate("sclass", "sclassName sclassSection")
      .lean();

    if (!paper) {
      return res.status(404).json({ ok: false, msg: "Paper not found" });
    }

    res.status(200).json({ data: paper, ok: true, msg: "Paper fetched" });
  } catch (error) {
    console.error("Error fetching paper by ID:", error);
    res.status(400).json({ ok: false, msg: error.message });
  }
}

// Optimized endpoint to fetch only the image (faster - no populate, only paper field)
async function getPaperImage(req, res) {
  const { paperId } = req.params;

  try {
    const paper = await Paper.findById(paperId).select("paper").lean();

    if (!paper) {
      return res.status(404).json({ ok: false, msg: "Paper not found" });
    }

    if (!paper.paper) {
      return res.status(404).json({ ok: false, msg: "Image not found" });
    }

    // Return only the image field for faster response
    res.status(200).json({ data: { paper: paper.paper }, ok: true, msg: "Image fetched" });
  } catch (error) {
    console.error("Error fetching paper image:", error);
    res.status(400).json({ ok: false, msg: error.message });
  }
}

// Update paper/assignment
async function updatePaper(req, res) {
  const { paperId } = req.params;

  try {
    const updatedPaper = await Paper.findByIdAndUpdate(
      paperId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("subject", "subName")
      .populate("sclass", "sclassName sclassSection");

    if (!updatedPaper) {
      return res.status(404).json({ ok: false, message: "Paper not found" });
    }

    console.log("Paper updated successfully:", updatedPaper._id);
    res.status(200).json({ data: updatedPaper, ok: true, message: "Paper updated successfully" });
  } catch (error) {
    console.error("Error updating paper:", error);
    res.status(400).json({ ok: false, message: error.message });
  }
}

// Delete paper/assignment
async function deletePaper(req, res) {
  const { paperId } = req.params;

  try {
    // Use deleteOne for faster deletion (no need to return the document)
    const result = await Paper.deleteOne({ _id: paperId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: "Paper not found" });
    }

    console.log("Paper deleted successfully:", paperId);
    res.status(200).json({ ok: true, message: "Paper deleted successfully" });
  } catch (error) {
    console.error("Error deleting paper:", error);
    res.status(400).json({ ok: false, message: error.message });
  }
}

async function makeQuestionPaper(req, res) {
  console.log(req.body.data);
  try {
    const data = await Paper.createPaper(req.body.data);
    res.status(200).json({
      data: data,
      ok: true,
      msg: "Quesion paper created successfully.",
    });
  } catch (error) {
    res.status(400).json({ ok: false, msg: error.message });
  }
}

async function getCLassAssignments(req, res) {
  const { sclass, subject } = req.body;
  try {
    const query = { sclass };
    if (subject) {
      query.subject = subject;
    }

    // Exclude large base64 image field for faster list fetch
    const paperData = await Paper.find(query)
      .select("-paper") // don't send image here
      .populate("subject", "subName")
      .populate("sclass", "sclassName sclassSection")
      .sort({ createdAt: -1 })
      .lean();

    // Exclude midterm/final (only assignments/quiz for students)
    const data = paperData.filter(
      (item) => item.paperType !== "midterm" && item.paperType !== "final"
    );

    res.status(200).json({ data, ok: true, msg: "Data Fetched" });
  } catch (error) {
    res.status(400).json({ ok: false, msg: error.message });
  }
}

// New endpoint for fetching exam papers (midterm/final) for students
async function getClassPapers(req, res) {
  const { sclass, subject } = req.body;
  try {
    const query = { sclass };
    if (subject) {
      query.subject = subject;
    }

    // Exclude large base64 image field for faster list fetch
    const paperData = await Paper.find(query)
      .select("-paper -questions") // don't send image or questions here
      .populate("subject", "subName")
      .populate("sclass", "sclassName sclassSection")
      .sort({ createdAt: -1 })
      .lean();

    // Only include midterm/final papers (exclude assignments/quiz)
    const data = paperData.filter(
      (item) => item.paperType === "midterm" || item.paperType === "final"
    );

    res.status(200).json({ data, ok: true, msg: "Papers Fetched" });
  } catch (error) {
    res.status(400).json({ ok: false, msg: error.message });
  }
}

async function saveAssignmentAnswer(req, res) {
  const studentId = req.body.studentId;
  const paperId = req.body.paperId;
  const newData = req.body;

  try {
    // Log attachment info (without logging the full base64 string)
    const hasAttachment = !!newData.attachment;
    const attachmentSize = newData.attachment ? newData.attachment.length : 0;
    console.log(`Saving submission - Student: ${studentId}, Paper: ${paperId}, Has Attachment: ${hasAttachment}, Attachment Size: ${attachmentSize} bytes, Attachment Name: ${newData.attachmentName || 'N/A'}`);

    // Ensure required fields are present
    if (!studentId || !paperId) {
      return res.status(400).json({ ok: false, msg: "studentId and paperId are required" });
    }

    // Optimized: Use findOneAndUpdate directly instead of find + save
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ ok: false, msg: "Student not found" });
    }

    const existingSubmission = student.examResult.find(
      (result) => result.paperId && result.paperId.toString() === paperId
    );

    if (existingSubmission) {
      // Update existing submission - use $set with array index for better performance
      const index = student.examResult.findIndex(
        (result) => result.paperId && result.paperId.toString() === paperId
      );

      // Ensure attachment fields are included in the update
      const updateData = {
        ...newData,
        attachment: newData.attachment || null,
        attachmentName: newData.attachmentName || null,
      };

      const updateResult = await Student.findOneAndUpdate(
        { _id: studentId },
        { $set: { [`examResult.${index}`]: updateData } },
        { new: true, lean: true }
      );

      // Verify attachment was saved
      const savedSubmission = updateResult?.examResult?.[index];
      const attachmentSaved = !!savedSubmission?.attachment;
      console.log(`Submission updated - Attachment saved: ${attachmentSaved}`);

      return res.status(200).json({
        message: "Assignment answer updated successfully",
        ok: true,
      });
    } else {
      // Create new submission - ensure attachment fields are included
      const submissionData = {
        ...newData,
        attachment: newData.attachment || null,
        attachmentName: newData.attachmentName || null,
      };

      await Student.findOneAndUpdate(
        { _id: studentId },
        { $push: { examResult: submissionData } },
        { new: false } // Don't return full document for better performance
      );

      console.log(`New submission created - Attachment included: ${!!submissionData.attachment}`);

      return res.status(200).json({
        message: "Assignment answer saved successfully",
        ok: true,
      });
    }
  } catch (error) {
    console.error("Error saving assignment answer:", error);
    res.status(500).json({ msg: error.message, ok: false });
  }
}

// Get student's submission for a specific paper
async function getStudentSubmission(req, res) {
  const { studentId, paperId } = req.body;
  try {
    const student = await Student.findById(studentId).select("examResult");
    if (!student) {
      return res.status(404).json({ ok: false, msg: "Student not found" });
    }

    const submission = student.examResult.find(
      (result) => result.paperId && result.paperId.toString() === paperId
    );

    if (!submission) {
      return res.status(200).json({ data: null, ok: true, msg: "No submission found" });
    }

    res.status(200).json({ data: submission, ok: true, msg: "Submission fetched" });
  } catch (error) {
    console.error("Error fetching student submission:", error);
    res.status(500).json({ ok: false, msg: error.message });
  }
}

// Delete student's submission for a specific paper
async function deleteStudentSubmission(req, res) {
  const { studentId, paperId } = req.body;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ ok: false, msg: "Student not found" });
    }

    student.examResult = student.examResult.filter(
      (result) => !result.paperId || result.paperId.toString() !== paperId
    );

    await student.save();
    res.status(200).json({ ok: true, msg: "Submission deleted successfully" });
  } catch (error) {
    console.error("Error deleting student submission:", error);
    res.status(500).json({ ok: false, msg: error.message });
  }
}

// Teacher: get all student submissions for a specific paper (without attachment for speed)
async function getPaperSubmissions(req, res) {
  const { paperId, teacherId } = req.body;
  try {
    if (!paperId) {
      return res.status(400).json({ ok: false, msg: "paperId is required" });
    }

    const paper = await Paper.findById(paperId)
      .select("teacherId sclass subject paperType totalMarks title")
      .lean();

    if (!paper) {
      return res.status(404).json({ ok: false, msg: "Paper not found" });
    }

    if (teacherId && paper.teacherId?.toString() !== teacherId?.toString()) {
      return res.status(403).json({ ok: false, msg: "Not allowed" });
    }

    const students = await Student.find({
      sclassName: paper.sclass,
      "examResult.paperId": paperId,
    })
      .select("name rollNum examResult.$")
      .lean();

    const data = (students || []).map((stu) => {
      const submission = Array.isArray(stu.examResult) ? stu.examResult[0] : null;
      if (submission) {
        // Keep attachmentName but exclude heavy base64 attachment data
        const hasAttachment = !!submission.attachment;
        const attachmentName = submission.attachmentName || null;
        // Create submission object without attachment but with attachmentName
        const { attachment, ...submissionWithoutAttachment } = submission;
        return {
          studentId: stu._id,
          name: stu.name,
          rollNum: stu.rollNum,
          submission: {
            ...submissionWithoutAttachment,
            hasAttachment, // Flag to indicate if attachment exists
            attachmentName, // Include attachment name
          },
        };
      }
      return {
        studentId: stu._id,
        name: stu.name,
        rollNum: stu.rollNum,
        submission: null,
      };
    });

    return res.status(200).json({
      ok: true,
      msg: "Submissions fetched",
      paper: {
        _id: paper._id,
        title: paper.title,
        totalMarks: paper.totalMarks,
        paperType: paper.paperType,
      },
      data,
    });
  } catch (error) {
    console.error("Error fetching paper submissions:", error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
}

// Teacher: fetch a student's submitted attachment for a paper (image/pdf)
async function getSubmissionAttachment(req, res) {
  const { studentId, paperId } = req.body;
  try {
    if (!studentId || !paperId) {
      return res
        .status(400)
        .json({ ok: false, msg: "studentId and paperId are required" });
    }

    const student = await Student.findById(studentId).select("examResult").lean();
    if (!student) {
      return res.status(404).json({ ok: false, msg: "Student not found" });
    }

    const submission = (student.examResult || []).find(
      (r) => r.paperId && r.paperId.toString() === paperId.toString()
    );

    if (!submission || !submission.attachment) {
      return res
        .status(200)
        .json({ ok: true, data: null, msg: "No attachment found" });
    }

    return res.status(200).json({
      ok: true,
      msg: "Attachment fetched",
      data: {
        attachment: submission.attachment,
        attachmentName: submission.attachmentName || null,
      },
    });
  } catch (error) {
    console.error("Error fetching submission attachment:", error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
}

// Teacher: set marks for a student's submission (only updates existing submission)
async function setSubmissionMarks(req, res) {
  const { studentId, paperId, marksObtained } = req.body;
  try {
    if (!studentId || !paperId) {
      return res
        .status(400)
        .json({ ok: false, msg: "studentId and paperId are required" });
    }

    const marks = Number(marksObtained);
    if (!Number.isFinite(marks) || marks < 0) {
      return res.status(400).json({ ok: false, msg: "Invalid marksObtained" });
    }

    const result = await Student.updateOne(
      { _id: studentId, "examResult.paperId": paperId },
      { $set: { "examResult.$.marksObtained": marks } }
    );

    if (!result.matchedCount) {
      return res
        .status(404)
        .json({ ok: false, msg: "Submission not found for this student" });
    }

    return res.status(200).json({ ok: true, msg: "Marks saved" });
  } catch (error) {
    console.error("Error setting submission marks:", error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
}

async function uploadStudentMarks(req, res) {
  const dataArray = req.body.data; // assuming req.body.data is an array
  try {
    await Promise.all(
      dataArray.map(async (item) => {
        const studentId = item.studentId;
        const paperId = item.paperId;
        console.log(paperId);
        console.log(studentId);

        const student = await Student.findById(studentId).select(
          "-password -studentImage "
        );
        const studentExam = student.examResult.find((exam) =>
          exam.paperId.equals(paperId)
        );

        if (!studentExam) {
          student.examResult.push({
            paperId: paperId,
            marksObtained: item.marks,
            ...item,
          });
        } else {
          studentExam.marksObtained = item.marks;
        }
        await student.save();
      })
    );

    res.json({ ok: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function generateReportCard(req, res) {
  const sclassName = req.body.sclass;
  const typeOfPaper = req.body.paperType;
  // const paperType = "assignment";

  try {
    const students = await Student.find({ sclassName })
      .populate("examResult.paperId")
      .populate({
        path: "examResult.paperId",
        populate: {
          path: "subject",
        },
      })
      .select("-password -studentImage -logo -feeByMonth -attendance");

    let stdExams = [];
    const filteredStudents = students.map((stu) => {
      let eObject = {};
      stu.examResult.map((one) => {
        let subname = one.paperId.subject.subName;
        if (eObject.hasOwnProperty(subname)) {
          console.log("ok");
        } else {
          eObject[subname] = {};
        }
        if (eObject[subname].hasOwnProperty(one.paperId.paperType)) {
          eObject[subname][one.paperId.paperType] += one.marksObtained;
        } else {
          if (typeOfPaper.includes(one.paperId.paperType))
            eObject[subname][one.paperId.paperType] = one.marksObtained;
        }
        // one.paperId.subject.subNam
      });

      // console.log(eObject);
      stdExams.push({ ...stu._doc, eObject });
      // const filteredExamResult = stu.examResult.filter((item) => {
      //   return paperType.includes(item.paperId.paperType);
      // return { ...stu._doc, examResult: eObject };
      // });
    });
    console.log(stdExams);

    res.status(200).send({ data: stdExams });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
}

async function generateMarkSheet(req, res) {
  const sclassName = req.body.sclass;
  const typeOfPaper = req.body.paperType;
  // const paperType = "assignment";

  try {
    const students = await Student.find({ sclassName })
      .populate("examResult.paperId")
      .populate({
        path: "examResult.paperId",
        populate: {
          path: "subject",
        },
      })
      .select("-password -logo -feeByMonth -attendance");

    let stdExams = [];
    let positions = [];
    let newMap = new Map();
    const filteredStudents = students.reverse().map((stu) => {
      let eObject = {};
      let totalMarks = 0;
      let obtainedMarks = 0;
      stu.examResult.map((one) => {
        let subname = one.paperId.subject.subName;
        if (eObject.hasOwnProperty(subname)) {
          // console.log("ok");
        } else {
          eObject[subname] = {};
        }
        if (eObject[subname].hasOwnProperty(one.paperId.paperType)) {
          eObject[subname][one.paperId.paperType] += one.marksObtained;

          eObject[subname][`${one.paperId.paperType}TotalMarks`] +=
            one.totalMarks;
          totalMarks += one.totalMarks;
          obtainedMarks += one.marksObtained;
        } else {
          if (typeOfPaper.includes(one.paperId.paperType))
            console.log(one.paperId.paperType);
          eObject[subname][one.paperId.paperType] = one.marksObtained;
          eObject[subname][`${one.paperId.paperType}TotalMarks`] =
            one.totalMarks;
          totalMarks += one.totalMarks;
          obtainedMarks += one.marksObtained;
        }
        // one.paperId.subject.subNam
        // console.log(totalMarks);
      });

      // console.log(eObject);
      let percentage = (obtainedMarks / totalMarks) * 100;
      newMap.set(`${stu._id}`, `${percentage}`);
      let fixedPercentage = percentage.toFixed(2);
      console.log(percentage.toFixed(2));
      positions.push(percentage.toFixed(2));
      // console.log(stu._id.toString());
      stdExams.push({
        ...stu._doc,
        eObject,
        percentage: fixedPercentage,
      });
      // const filteredExamResult = stu.examResult.filter((item) => {
      //   return paperType.includes(item.paperId.paperType);
      // return { ...stu._doc, examResult: eObject };
      // });
    });
    const sortedArray = Array.from(newMap);
    // console.log(sortedArray);
    const xArray = sortedArray.sort(
      (a, b) => parseFloat(a[1]) - parseFloat(b[1])
    );
    const nArray = xArray
      .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
      .reverse();
    // console.log(nArray);

    let finalStdArray = [];

    nArray.forEach((x) => {
      const index = nArray.indexOf(x);
      const matchingStudent = stdExams.find(
        (student) => student._id.toString() == x[0]
      );
      if (matchingStudent) {
        finalStdArray.push({ ...matchingStudent, position: index + 1 });
      }
    });

    // console.log(finalStdArray);
    // console.log(stdExams);
    // const studendSTh = stdExams.map((item) => {
    //   let indexx = x[0].indexOf(item._id);
    //   console.log(x);
    //   console.log(indexx);
    // });

    // const srotedMap = new Map(nArray);
    // console.log(srotedMap);
    // let sorted = postions.sort();
    // let descendSorted = sorted.reverse();
    // console.log(descendSorted);
    // console.log(newMap);

    // newMap.forEach((value, index) => {
    //   console.log(value, index);
    // });
    // console.log(stdExams);

    res.status(200).send({ data: finalStdArray });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
}

async function getGradebookData(req, res) {
  const { sclass, subject, teacherId, paperType } = req.body;
  try {
    if (!sclass || !subject) {
      return res.status(400).json({ ok: false, msg: "Class and Subject are required" });
    }

    const mongoose = require("mongoose");
    const query = {
      sclass: new mongoose.Types.ObjectId(sclass),
      subject: new mongoose.Types.ObjectId(subject),
    };

    if (paperType) {
      if (Array.isArray(paperType)) {
        query.paperType = { $in: paperType };
      } else {
        query.paperType = paperType;
      }
    }

    // Optional: Only filter by teacher if you want to strictly show only that teacher's papers.
    // if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId);

    const assignments = await Paper.find(query)
      .select("title totalMarks paperType createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const students = await Student.find({ sclassName: new mongoose.Types.ObjectId(sclass) })
      .select("name rollNum examResult")
      .lean();

    res.status(200).json({ ok: true, data: { assignments, students } });
  } catch (error) {
    console.error("Error fetching gradebook data:", error);
    res.status(500).json({ ok: false, msg: error.message });
  }
}

module.exports = {
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
  getStudentSubmission,
  deleteStudentSubmission,
  getPaperSubmissions,
  getSubmissionAttachment,
  setSubmissionMarks,
  uploadStudentMarks,
  generateReportCard,
  generateMarkSheet,
  getGradebookData,
};
