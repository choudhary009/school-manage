const Message = require("../models/messageSchema.js");

const sendMessage = async (req, res) => {
    try {
        const newMessage = await Message.create(req.body);
        res.send(newMessage);
    } catch (err) {
        res.status(500).json(err);
    }
};

const getMessages = async (req, res) => {
    try {
        const { sender, receiver } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read for the receiver
        await Message.updateMany(
            { sender: receiver, receiver: sender, isRead: false },
            { $set: { isRead: true } }
        );

        res.send(messages);
    } catch (err) {
        res.status(500).json(err);
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const count = await Message.countDocuments({ receiver: receiverId, isRead: false });
        res.status(200).json({ count, ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const getConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        const mongoose = require('mongoose');
        const uid = new mongoose.Types.ObjectId(userId);

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: uid },
                        { receiver: uid }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", uid] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$message" },
                    lastTimestamp: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$receiver", uid] }, { $eq: ["$isRead", false] }] },
                                1,
                                0
                            ]
                        }
                    },
                    otherRole: {
                        $first: {
                            $cond: [
                                { $eq: ["$sender", uid] },
                                "$receiverModel",
                                "$senderModel"
                            ]
                        }
                    }
                }
            },
            // Lookup for students
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            // Lookup for teachers
            {
                $lookup: {
                    from: "teachers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "teacherInfo"
                }
            },
            // Lookup for admins
            {
                $lookup: {
                    from: "admins",
                    localField: "_id",
                    foreignField: "_id",
                    as: "adminInfo"
                }
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    lastTimestamp: 1,
                    unreadCount: 1,
                    otherRole: 1,
                    name: {
                        $concat: [
                            { $ifNull: [{ $arrayElemAt: ["$studentInfo.name", 0] }, ""] },
                            { $ifNull: [{ $arrayElemAt: ["$teacherInfo.name", 0] }, ""] },
                            { $ifNull: [{ $arrayElemAt: ["$adminInfo.name", 0] }, ""] }
                        ]
                    }
                }
            },
            { $sort: { lastTimestamp: -1 } }
        ]);

        res.status(200).json({ conversations, ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        await Message.updateMany(
            { sender: sender, receiver: receiver, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ ok: true, message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndDelete(id);
        res.status(200).json({ ok: true, message: "Message deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const sendBulkMessage = async (req, res) => {
    try {
        const { messages } = req.body; // Array of message objects
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages array is required", ok: false });
        }

        const newMessages = await Message.insertMany(messages);
        res.status(200).json({ ok: true, count: newMessages.length });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

module.exports = { sendMessage, getMessages, getUnreadCount, markAsRead, getConversations, deleteMessage, sendBulkMessage };

