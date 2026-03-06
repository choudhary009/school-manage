const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const companySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  shopName: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  contacts: [{
    name: {
      type: String,
      trim: true,
      default: ''
    },
    number: {
      type: String,
      trim: true,
      default: ''
    }
  }],
  billHeaderImage: {
    type: String,
    default: ''
  },
  persons: [personSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    enum: ['en', 'ur', 'both'],
    default: 'en'
  },
  websiteLanguage: {
    type: String,
    enum: ['en', 'ur', 'both'],
    default: 'en'
  },
  offlinePassKey: {
    type: String,
    default: ''
  },
  onlinePassKey: {
    type: String,
    default: ''
  },
  offlinePassKeyExpiresAt: {
    type: Date,
    default: null
  },
  onlinePassKeyExpiresAt: {
    type: Date,
    default: null
  },
  pagePermissions: {
    type: Map,
    of: Boolean,
    default: () => new Map()
  },
  dashboardType: {
    type: String,
    enum: ['main', 'part2'],
    default: 'main'
  },
  units: {
    type: [String],
    default: []
  },
  itemNames: {
    type: [String],
    default: []
  },
  cloudToken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

companySchema.index({ username: 1 });
companySchema.index({ email: 1 });

// Hash password before saving
companySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
companySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Company', companySchema);

