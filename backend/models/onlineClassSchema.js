const mongoose = require("mongoose");

const onlineClassSchema = new mongoose.Schema(
    {
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subject",
        },
        subjectName: {
            type: String,
            required: true,
        },
        sclass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sclass",
            required: true,
        },
        className: {
            type: String,
        },
        classTitle: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        meetingLink: {
            type: String,
            required: true,
        },
        meetingId: {
            type: String,
        },
        meetingPassword: {
            type: String,
        },
        scheduledDate: {
            type: Date,
            required: true,
        },
        scheduledTime: {
            type: String,
            required: true,
        },
        duration: {
            type: String,
            default: "60",
        },
        status: {
            type: String,
            enum: ["scheduled", "ongoing", "completed", "cancelled"],
            default: "scheduled",
        },
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admin",
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "teacher",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("onlineClass", onlineClassSchema);
