const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    teacherImage: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Teacher",
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    teachSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
    ],
    teachSclasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sclass",
        required: true,
      },
    ],
    attendance: [
      {
        date: {
          type: Date,
          required: true,
        },
        presentCount: {
          type: Number,
          default: 0,
        },
        absentCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Additional information
    qualifications: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    // CV upload
    cvImage: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("teacher", teacherSchema);
