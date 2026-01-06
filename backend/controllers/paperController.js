const Paper = require("../models/paperSchema");
const Student = require("../models/studentSchema");

async function createPaper(req, res) {
  console.log(req.body);
  try {
    const data = await Paper.createPaper(req.body);
    res
      .status(200)
      .json({ data: data, ok: true, message: "Created Successfully" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
}

async function getPaperBySubjectTeacher(req, res) {
  const { teacherId, sclass, subject } = req.body;
  console.log(teacherId, sclass, subject);
  let query = { sclass, subject };

  if (teacherId) {
    query.teacherId = teacherId;
  }
  try {
    const data = await Paper.find(query).populate("subject").populate("sclass");
    res.status(200).json({ data: data, ok: true, msg: "Data Fetched" });
  } catch (error) {
    res.status(400).json({ ok: false, msg: error.message });
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
    const paperData = await Paper.find({ sclass, subject })
      .populate("subject")
      .populate("sclass");
    const data = paperData.filter((item) => {
      return item.paperType !== "midterm" && item.paperType !== "final";
    });
    // console.log(filteredPapers);
    res.status(200).json({ data: data, ok: true, msg: "Data Fetched" });
  } catch (error) {
    res.status(400).json({ ok: false, msg: error.message });
  }
}

async function saveAssignmentAnswer(req, res) {
  const studentId = req.body.studentId;
  console.log(studentId);
  const newData = req.body;
  console.log(newData);
  try {
    const data = await Student.findOneAndUpdate(
      { _id: studentId },
      { $push: { examResult: newData } },
      { new: true }
    );
    res.status(200).json({
      data: data,
      message: "Assignment answer saved successfully",
      ok: true,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: error.message, ok: false });
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

module.exports = {
  createPaper,
  getPaperBySubjectTeacher,
  makeQuestionPaper,
  getCLassAssignments,
  saveAssignmentAnswer,
  uploadStudentMarks,
  generateReportCard,
  generateMarkSheet,
};
