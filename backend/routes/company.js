const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const { verifyCompany } = require('../middleware/auth');
const ensureMongoConnection = require('../middleware/mongoConnection');

// Get company profile
router.get('/profile', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Convert pagePermissions Map to object for JSON serialization
    const companyObj = company.toObject();
    if (company.pagePermissions && company.pagePermissions instanceof Map) {
      companyObj.pagePermissions = Object.fromEntries(company.pagePermissions);
    }

    res.json({ company: companyObj });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update company profile
router.put('/profile', verifyCompany, async (req, res) => {
  try {
    const { shopName, logo, address, contactNumber, contacts, persons } = req.body;

    const company = await Company.findById(req.user.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (shopName !== undefined) company.shopName = shopName;
    if (logo !== undefined) company.logo = logo;
    if (address !== undefined) company.address = address;
    if (contactNumber !== undefined) company.contactNumber = contactNumber;
    if (contacts !== undefined && Array.isArray(contacts)) {
      company.contacts = contacts;
    }
    if (persons !== undefined && Array.isArray(persons)) {
      company.persons = persons;
    }

    await company.save();

    res.json({
      message: 'Profile updated successfully',
      company: {
        id: company._id,
        username: company.username,
        email: company.email,
        shopName: company.shopName,
        logo: company.logo,
        address: company.address,
        contactNumber: company.contactNumber,
        contacts: company.contacts,
        billHeaderImage: company.billHeaderImage,
        persons: company.persons
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add person to company
router.post('/persons', verifyCompany, async (req, res) => {
  try {
    const { name, contactNumber } = req.body;

    if (!name || !contactNumber) {
      return res.status(400).json({ message: 'Please provide name and contact number' });
    }

    const company = await Company.findById(req.user.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.persons.push({ name, contactNumber });
    await company.save();

    res.json({
      message: 'Person added successfully',
      company: {
        id: company._id,
        persons: company.persons
      }
    });
  } catch (error) {
    console.error('Add person error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update person
router.put('/persons/:personId', verifyCompany, async (req, res) => {
  try {
    const { name, contactNumber } = req.body;

    const company = await Company.findById(req.user.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const person = company.persons.id(req.params.personId);

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    if (name) person.name = name;
    if (contactNumber) person.contactNumber = contactNumber;

    await company.save();

    res.json({
      message: 'Person updated successfully',
      person
    });
  } catch (error) {
    console.error('Update person error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete person
router.delete('/persons/:personId', verifyCompany, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.persons.id(req.params.personId).remove();
    await company.save();

    res.json({
      message: 'Person deleted successfully',
      company: {
        id: company._id,
        persons: company.persons
      }
    });
  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get company units
router.get('/units', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select('units');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ units: company.units || [] });
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new unit
router.post('/units', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const { unit } = req.body;
    if (!unit || !unit.trim()) {
      return res.status(400).json({ message: 'Unit name is required' });
    }
    const company = await Company.findById(req.user.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const trimmedUnit = unit.trim();
    const exists = (company.units || []).some(
      u => u.toLowerCase() === trimmedUnit.toLowerCase()
    );
    if (!exists) {
      company.units.push(trimmedUnit);
      await company.save();
    }

    res.json({ units: company.units, message: exists ? 'Unit already exists' : 'Unit added' });
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get company item names
router.get('/item-names', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select('itemNames');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ itemNames: company.itemNames || [] });
  } catch (error) {
    console.error('Get item names error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new item name
router.post('/item-names', verifyCompany, ensureMongoConnection, async (req, res) => {
  try {
    const { itemName } = req.body;
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    const company = await Company.findById(req.user.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const trimmed = itemName.trim();
    const exists = (company.itemNames || []).some(
      n => n.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      company.itemNames.push(trimmed);
      await company.save();
    }

    res.json({ itemNames: company.itemNames, message: exists ? 'Item name already exists' : 'Item name added' });
  } catch (error) {
    console.error('Add item name error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


