const OnlineClass = require("../models/onlineClassSchema");

const createOnlineClass = async (req, res) => {
    try {
        const onlineClass = new OnlineClass(req.body);
        const result = await onlineClass.save();
        res.status(200).json({ data: result, ok: true, message: "Class Scheduled Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const getOnlineClassesBySchool = async (req, res) => {
    try {
        const list = await OnlineClass.find({ school: req.params.id })
            .populate("subject", "subName")
            .populate("sclass", "sclassName sclassSection")
            .sort({ scheduledDate: 1, scheduledTime: 1 });
        res.status(200).json({ data: list, ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const getOnlineClassesByClass = async (req, res) => {
    try {
        const list = await OnlineClass.find({ sclass: req.params.id })
            .populate("subject", "subName")
            .sort({ scheduledDate: 1, scheduledTime: 1 });
        res.status(200).json({ data: list, ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const deleteOnlineClass = async (req, res) => {
    try {
        const result = await OnlineClass.findByIdAndDelete(req.params.id);
        res.status(200).json({ data: result, ok: true, message: "Class Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

const updateOnlineClass = async (req, res) => {
    try {
        const result = await OnlineClass.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json({ data: result, ok: true, message: "Class Updated Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message, ok: false });
    }
};

module.exports = {
    createOnlineClass,
    getOnlineClassesBySchool,
    getOnlineClassesByClass,
    deleteOnlineClass,
    updateOnlineClass,
};
