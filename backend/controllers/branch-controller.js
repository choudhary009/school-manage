const Branch = require('../models/branchSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Sclass = require('../models/sclassSchema.js');
const Subject = require('../models/subjectSchema.js');

// Create a new branch
const createBranch = async (req, res) => {
  try {
    const { branchName, address, email, password, phoneNumber, headName, mainSchool } = req.body;

    // Check if email already exists
    const existingBranch = await Branch.findOne({ email });
    if (existingBranch) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const branch = new Branch({
      branchName,
      address,
      email,
      password,
      phoneNumber,
      headName,
      mainSchool,
    });

    const result = await branch.save();
    result.password = undefined;
    res.status(201).json({ ok: true, data: result, message: 'Branch created successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Branch login
const branchLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const branch = await Branch.findOne({ email });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const isPasswordValid = await branch.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    branch.password = undefined;
    res.json(branch);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Get all branches for a main school
const getBranches = async (req, res) => {
  try {
    const { mainSchoolId } = req.params;
    const branches = await Branch.find({ mainSchool: mainSchoolId, isActive: true })
      .select('-password')
      .populate('mainSchool', 'name schoolName');
    
    res.json({ ok: true, data: branches });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Get branch details
const getBranchDetail = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .select('-password')
      .populate('mainSchool', 'name schoolName email');
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ ok: true, data: branch });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Get branch statistics (students, teachers, classes, etc.)
const getBranchStats = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Get students count for this branch
    const studentsCount = await Student.countDocuments({ school: branchId });
    
    // Get teachers count for this branch
    const teachersCount = await Teacher.countDocuments({ school: branchId });
    
    // Get classes count for this branch
    const classesCount = await Sclass.countDocuments({ school: branchId });
    
    // Get subjects count for this branch
    const subjectsCount = await Subject.countDocuments({ school: branchId });

    res.json({
      ok: true,
      data: {
        students: studentsCount,
        teachers: teachersCount,
        classes: classesCount,
        subjects: subjectsCount,
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.password) {
      const branch = await Branch.findById(id);
      if (branch) {
        branch.password = updates.password;
        await branch.save();
        delete updates.password;
      }
    }

    const branch = await Branch.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ ok: true, data: branch, message: 'Branch updated successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Delete/Deactivate branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - set isActive to false
    const branch = await Branch.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ ok: true, message: 'Branch deactivated successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  createBranch,
  branchLogIn,
  getBranches,
  getBranchDetail,
  getBranchStats,
  updateBranch,
  deleteBranch,
};

