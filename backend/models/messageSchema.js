const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'admin']
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'admin']
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optimization: Add indexes for faster fetching
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, sender: 1 });
messageSchema.index({ createdAt: 1 });

module.exports = mongoose.model("message", messageSchema);

