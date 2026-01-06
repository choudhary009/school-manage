const mongoose = require('mongoose');

const studentDetailsSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contact: {
    phone: String,
    email: String
  },
  bloodGroup: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  religion: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  fatherOccupation: String,
  class: {
    type: String,
    required: true
  }
});

studentDetailsSchema.statics

const StudentDetails = mongoose.model('StudentDetails', studentDetailsSchema);

module.exports = Student;
