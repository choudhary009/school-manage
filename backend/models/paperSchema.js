const mongoose = require("mongoose");
const paperSchema = new mongoose.Schema(
  {
    title: String,
    school: {
      type: mongoose.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    teacherId: {
      type: mongoose.Types.ObjectId,
      ref: "teacher", // Reference to Teacher model if applicable
      required: true,
    },
    sclass: {
      type: mongoose.Types.ObjectId,
      ref: "sclass", // Assuming classId is a string, modify if it's different
      required: true,
    },
    subject: {
      type: mongoose.Types.ObjectId,
      ref: "subject", // Reference to Subject model if applicable
      required: true,
    },
    paperType: {
      type: String,
      enum: ["monthly", "weekly", "assignment", "midterm", "final"], // Valid options
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    submit: {
      type: String,
    },
    paper: {
      type: String,
    },
    deadline: {
      type: Date,
    },
    questions: [
      {
        q: { type: String },
        space: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for faster queries
paperSchema.index({ teacherId: 1, sclass: 1, subject: 1 });
paperSchema.index({ teacherId: 1, paperType: 1 });
paperSchema.index({ sclass: 1, subject: 1, paperType: 1 });
paperSchema.index({ createdAt: -1 }); // For sorting

// Add static method before creating model
paperSchema.statics.createPaper = async function(data) {
  try {
    const newPaper = new this(data);
    await newPaper.save();
    return newPaper;
  } catch (error) {
    console.error("Error in createPaper static method:", error);
    throw error;
  }
};

const Paper = mongoose.model("Paper", paperSchema);

module.exports = Paper;
