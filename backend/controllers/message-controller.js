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

module.exports = { sendMessage, getMessages, getUnreadCount, markAsRead };
