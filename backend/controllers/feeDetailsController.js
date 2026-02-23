const FeeDetails = require("../models/feeDetailsSchema");
const Student = require("../models/studentSchema");

async function setFeeDetails(req, res) {
  const studentId = req.body.studentId;
  console.log("Received studentId:", studentId);
  
  // studentId is optional now (student select field removed from frontend)

  // Validate tuitionFee (required field)
  if (req.body.tuitionFee === undefined || req.body.tuitionFee === null) {
    return res.status(400).json({ 
      ok: false, 
      error: "Tuition Fee is required" 
    });
  }

  // Ensure tuitionFee is a number
  const tuitionFee = parseFloat(req.body.tuitionFee);
  if (isNaN(tuitionFee)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Tuition Fee must be a valid number" 
    });
  }

  try {
    // Remove studentId and sclassName from req.body before saving fee details
    // (these are not part of the feeDetails schema)
    const { studentId: _studentId, sclassName: _sclassName, ...feeDetailsData } = req.body;
    
    // Ensure all fee fields are numbers
    const cleanedFeeData = {};
    for (const [key, value] of Object.entries(feeDetailsData)) {
      // If it's a fee field (ends with Fee or is a known fee field), convert to number
      if (key.toLowerCase().includes('fee') || key.toLowerCase().includes('charge') || 
          ['tuitionFee', 'admissionFee', 'registrationFee', 'examinationFee', 
           'libraryFee', 'laboratoryFee', 'sportsFee', 'computerFee', 'transportFee', 
           'hostelFee', 'securityFee', 'stationaryFee', 'uniformFee', 'assessmentFee'].includes(key)) {
        cleanedFeeData[key] = parseFloat(value) || 0;
      } else {
        // Keep other fields as is (description, bankName, etc.)
        cleanedFeeData[key] = value;
      }
    }

    const data = await FeeDetails.addFeeDetails(cleanedFeeData);
    // console.log(data._id);
    
    // Only link to student if studentId is provided
    if (studentId && studentId !== "") {
      const findStudent = await Student.findByIdAndUpdate(
        studentId,
        { feeDetails: data._id },
        { new: true }
      );
      // console.log(findStudent);
      if (!findStudent) {
        // Still return success even if student not found (fee details saved)
        console.warn("Student not found, but fee details saved:", studentId);
      }
    }
    
    res.status(200).json({
      feeDetailsId: data._id,
      ok: true,
      message: "Data inserted successfully",
    });
  } catch (error) {
    console.error("Error in setFeeDetails:", error);
    res.status(400).json({ ok: false, error: error.message });
  }
}

async function setFeeDetailsByMonth(req, res) {
  // console.log(req.body);
  const { month, studentId, year, dueDate } = req.body;
  // console.log(month, studentId, year, dueDate);
  try {
    // const data = await FeeDetails.addFeeDetails(req.body);
    // console.log(data);
    if (Array.isArray(studentId)) {
      const results = [];
      //
      for (const id of studentId) {
        const findStudent = await Student.findById(id).select(
          "-password -studentImage"
        );
        // console.log(findStudent.name);
        const existingFeeIndex = findStudent.feeByMonth.findIndex(
          (fee) => fee.month === month && fee.year === year
        );

        if (existingFeeIndex !== -1) {
          //if existing
          findStudent.feeByMonth[existingFeeIndex] = {
            month: month,
            feeId: findStudent.feeDetails,
            isPaid: false,
            year: year,
            dueDate: dueDate,
          };
          //update logic here
        } else {
          //       console.log(findStudent.feeByMonth);
          findStudent.feeByMonth.push({
            month: month,
            feeId: findStudent.feeDetails,
            isPaid: false,
            year: year,
            dueDate: dueDate,
          });
          const newStudentOBJ = await findStudent.save();
          // console.log(newStudentOBJ);
        }
        // console.log(findStudent.feeByMonth);
      }
    }
    //       console.log(month, year, findStudent.feeDetails);
    //     }
    //     console.log("outside");
    //     const updatedStudent = await findStudent.save();
    //     console.log(updatedStudent);
    //     results.push(updatedStudent);
    //   }

    //   res.status(200).json({
    //     data: results,
    //     ok: true,
    //     message: "Successfully updated!",
    //   });
    // } else {
    //   throw new Error("studentId must be an array");
    // }
  } catch (error) {
    console.log(error.message);
    // res.status(400).json({ ok: false, error: error.message });
  }
}

async function getAllFeeDetails(req, res) {
  const { sclassName, month, year } = req.body;
  try {
    const data = await Student.find({ sclassName })
      .select("-password -studentImage")
      .populate({
        path: "feeByMonth",
        populate: {
          path: "feeId",
        },
      })
      .populate("school")
      .populate("sclassName");
    let dueDate = "";
    const feeData = data.map((item) => {
      // console.log(item.feeByMonth);
      const attendance = item.feeByMonth
        .filter((filter) => {
          if (filter.month === month && filter.year === year) {
            console.log("item", filter);
            return filter;
          }
        })
        .map((feeByMonthItem) => {
          // console.log(feeByMonthItem);
          return {
            ...feeByMonthItem.toObject(),
            feeId: feeByMonthItem.feeId
              ? feeByMonthItem.feeId.toObject()
              : null,
          };
        })[0];
      // console.log(item.feeByMonth);
      // console.log(attendance);

      return {
        attendance,
        name: item.name,
        rollNo: item.rollNum,
        school: item.school.schoolName,
        fatherName: item.fatherName,
        className: item.sclassName.sclassName,
        section: item.sclassName.sclassSection,
        logo: item.feeByMonth.dueDate,
      };
    });

    // console.log(feeData);

    res.status(200).json({
      data: feeData,
      ok: true,
      message: "Successfully fetched the students.",
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

async function updateFeeDetails(req, res) {
  const feeDetailsId = req.params.id;
  const studentId = req.body.studentId;
  console.log(req.body);

  try {
    if (!feeDetailsId) {
      // Add new fee details and associate with the student
      const newFeeDetails = await FeeDetails.addFeeDetails(req.body);

      const data = await Student.findByIdAndUpdate(
        studentId,
        { feeDetails: newFeeDetails._id },
        { new: true }
      );
      res.status(200).json({
        data: data,
        ok: true,
        message: "Updated Successfully",
      });
    } else {
      // Update existing fee details
      const data = await FeeDetails.findByIdAndUpdate(feeDetailsId, req.body, {
        new: true,
      });
      res.status(200).json({
        data: data,
        ok: true,
        message: "Updated Successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message, ok: false });
  }
}
async function saveFeeStatus(req, res) {
  try {
    const dataArray = req.body.data;

    for (const data of dataArray) {
      const feeDetailId = data.feeDetails._id;
      const feeDetail = await FeeDetails.findById(feeDetailId);

      if (!feeDetail) {
        return res.status(404).json({ message: "Fee details not found" });
      }

      const totalFee = data.feeByMonth[0].totalAmount;
      const paidFee = data.feeByMonth[0].paidAmount;

      if (isNaN(totalFee) || isNaN(paidFee)) {
        return res.status(400).json({ message: "Invalid totalFee or paidFee" });
      }

      let feeLeft = totalFee - paidFee;
      if (isNaN(feeLeft)) {
        feeLeft = 0;
      }

      feeDetail.feeLeft = feeLeft;
      const updatedFeeData = await feeDetail.save();
      const studentId = data._id;
      const studentSave = await Student.findByIdAndUpdate(studentId).select(
        "-password -studentImage -logo"
      );

      const fee = studentSave.feeByMonth.filter(
        (filter) =>
          filter.month === data.feeByMonth[0].month &&
          filter.year === data.feeByMonth[0].year
      );

      if (fee.length > 0) {
        if (feeLeft === 0) {
        }
        fee[0].totalAmount = data.feeByMonth[0].totalAmount;
        fee[0].paidAmount = data.feeByMonth[0].paidAmount;
        fee[0].status = data.feeByMonth[0].status;

        try {
          await studentSave.save();
          console.log("Student data saved:", studentSave);
        } catch (error) {
          console.error("Error saving student data:", error);
        }
      }
    }

    res.status(200).json({ message: "Fee status saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  setFeeDetails,
  getAllFeeDetails,
  setFeeDetailsByMonth,
  updateFeeDetails,
  saveFeeStatus,
};
