const mongoose = require('mongoose');
const Student = require('./models/studentSchema');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to DB');
    const student = await Student.findOne({ siblingId: { $ne: null, $ne: '' } });
    if (student) {
      console.log('Valid Sibling ID found:', student.siblingId);
      console.log('School ID:', student.school);
    } else {
      console.log('No sibling IDs found in database.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
