const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

// Force using the correct database connection
const MONGODB_URI = 'mongodb+srv://usama:1234usama@cluster0.lpskxdo.mongodb.net/manditrade?appName=Cluster0';

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in log

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Normalize email
    const adminEmail = 'admin@gmail.com'.toLowerCase().trim();
    
    // Check if admin already exists (case-insensitive)
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin123', // Will be hashed automatically
      role: 'super_admin'
    });

    await admin.save();
    console.log('Default admin created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

