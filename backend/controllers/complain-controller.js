const Complain = require('../models/complainSchema.js');

const complainCreate = async (req, res) => {
    try {
        const complain = new Complain(req.body)
        const result = await complain.save()
        res.send(result)
    } catch (err) {
        res.status(500).json(err);
    }
};

const complainList = async (req, res) => {
    try {
        let complains = await Complain.find({ school: req.params.id }).populate("user", "name");
        if (complains.length > 0) {
            res.send(complains)
        } else {
            res.send({ message: "No complains found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const complainListByUser = async (req, res) => {
    try {
        let complains = await Complain.find({ user: req.params.id }).populate("user", "name");
        if (complains.length > 0) {
            res.send(complains)
        } else {
            res.send({ message: "No complains found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const deleteComplain = async (req, res) => {
    try {
        const result = await Complain.findByIdAndDelete(req.params.id);
        res.send(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Added updateComplain function
const updateComplain = async (req, res) => {
    try {
        const result = await Complain.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.send(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = { complainCreate, complainList, complainListByUser, deleteComplain, updateComplain };
