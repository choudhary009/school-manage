const Timetable = require("../models/timetableSchema.js");

const addTimetableSlot = async (req, res) => {
    try {
        const { day, period, sclassName, school } = req.body;

        // Check if slot already exists for this class, day and period
        const existingSlot = await Timetable.findOne({ day, period, sclassName, school });

        if (existingSlot) {
            const updatedSlot = await Timetable.findByIdAndUpdate(
                existingSlot._id,
                { $set: req.body },
                { new: true }
            );
            return res.status(200).json(updatedSlot);
        }

        const newSlot = new Timetable(req.body);
        const result = await newSlot.save();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTimetableByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const timetable = await Timetable.find({ sclassName: classId })
            .populate("subjectId", "subName")
            .populate("teacherId", "name");

        if (timetable.length > 0) {
            res.status(200).json(timetable);
        } else {
            res.status(200).json([]); // Return empty array if not found
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteTimetableSlot = async (req, res) => {
    try {
        const result = await Timetable.findByIdAndDelete(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTimetableByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const timetable = await Timetable.find({ teacherId: teacherId })
            .populate("sclassName", "sclassName sclassSection")
            .populate("subjectId", "subName");

        res.status(200).json(timetable);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTimetablesBySchool = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const timetable = await Timetable.find({ school: schoolId })
            .populate("sclassName", "sclassName sclassSection")
            .populate("subjectId", "subName")
            .populate("teacherId", "name");

        res.status(200).json(timetable);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    addTimetableSlot,
    getTimetableByClass,
    deleteTimetableSlot,
    getTimetableByTeacher,
    getTimetablesBySchool
};
