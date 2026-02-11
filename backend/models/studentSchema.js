const mongoose = require("mongoose");
const FeeDetails = require("./feeDetailsSchema");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true,
  },
  logo: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
  religion: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  fatherOccupation: String,
  rollNum: {
    type: Number,
    required: true,
  },
  registerNumber: {
    type: String,
  },
  email: {
    type: String,
    sparse: true,
  },
  mobilePhone: {
    type: String,
  },
  height: { type: String },
  weight: { type: String },
  studentImage: {
    type: String,
    // Image is optional; UI may allow creating a student without photo
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  sclassName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sclass",
    required: true,
  },
  sclassSection: {
    type: String,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  role: {
    type: String,
    default: "Student",
  },

  examResult: [
    {
      paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Paper",
      },
      marksObtained: {
        type: Number,
      },
      totalMarks: {
        type: Number,
      },
      question: [{ question: String, answer: String }],
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
      title: {
        type: String,
      },
      type: {
        type: String,
      },
      attachment: {
        type: String, // Base64 encoded file (PDF/image)
      },
      attachmentName: {
        type: String, // Original file name
      },
    },
  ],
  attendance: [
    {
      date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["Present", "Absent", "present", "absent"],
        required: true,
      },
      subName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
        required: true,
      },
    },
  ],
  feeDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeeDetails",
  },
  discount: {
    type: Number,
    default: 0,
  },
  feeByMonth: [
    {
      month: {
        type: String,
      },
      feeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeeDetails",
        required: true,
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
      year: {
        type: Number,
      },
      totalAmount: {
        type: Number,
      },
      paidAmount: {
        type: Number,
      },
      status: {
        type: String,
        default: "Not Paid",
      },
      dueDate: {
        type: Date,
      },
    },
  ],
});

module.exports = mongoose.model("student", studentSchema);
