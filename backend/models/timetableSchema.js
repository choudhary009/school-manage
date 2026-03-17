const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
    {
        day: {
            type: String,
            required: true,
        },
        period: {
            type: String,
            required: true,
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subject",
            required: true,
        },
        subjectName: {
            type: String,
            required: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "teacher",
        },
        teacherName: {
            type: String,
        },
        sclassName: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sclass",
            required: true,
        },
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admin",
            required: true,
        },
        room: {
            type: String,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("timetable", timetableSchema);
