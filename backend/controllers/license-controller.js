const crypto = require("crypto");
const LicenseKey = require("../models/licenseKeySchema");
const Admin = require("../models/adminSchema");

function generateKey() {
  return crypto.randomBytes(16).toString("hex");
}

async function createInitialPasskeysForAdmin(adminId) {
  const admin = await Admin.findById(adminId);
  if (!admin) return;

  const baseDescription = `Initial keys for ${admin.schoolName || admin.name}`;

  const existing = await LicenseKey.findOne({ admin: adminId });
  if (existing) return; // avoid duplicates on re-call

  const now = new Date();
  const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const docs = [
    {
      admin: adminId,
      key: generateKey(),
      type: "online",
      description: `${baseDescription} (online)`,
      expiresAt: defaultExpiry,
    },
    {
      admin: adminId,
      key: generateKey(),
      type: "offline",
      description: `${baseDescription} (offline)`,
      expiresAt: defaultExpiry,
    },
  ];

  await LicenseKey.insertMany(docs);
}

// Super admin: list all keys for an admin
const getAdminPasskeys = async (req, res) => {
  try {
    const { adminId } = req.params;
    const keys = await LicenseKey.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .lean();
    res.send(keys);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch passkeys" });
  }
};

// Super admin: update expiry / active flag
const updatePasskey = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.expiresAt !== undefined) {
      updates.expiresAt = req.body.expiresAt;
    }
    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive;
    }
    const key = await LicenseKey.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    if (!key) {
      return res.status(404).json({ message: "Passkey not found" });
    }
    res.send(key);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update passkey" });
  }
};

// Electron app / admin client: validate passkey and register device
const validatePasskey = async (req, res) => {
  try {
    const { key, mode, deviceId, deviceName, ipAddress, location } = req.body;

    if (!key || !mode) {
      return res
        .status(400)
        .json({ message: "key and mode (online/offline) are required" });
    }

    const type = mode === "offline" ? "offline" : "online";

    const now = new Date();
    const license = await LicenseKey.findOne({ key, type }).populate(
      "admin",
      "name email schoolName"
    );

    if (!license) {
      return res.status(404).json({ message: "Invalid passkey" });
    }

    if (!license.isActive) {
      return res.status(403).json({ message: "Passkey is disabled" });
    }

    if (license.expiresAt && license.expiresAt < now) {
      return res.status(403).json({ message: "Passkey has expired" });
    }

    // Attach / update device info
    license.deviceId = deviceId || license.deviceId;
    license.deviceName = deviceName || license.deviceName;
    license.ipAddress = ipAddress || license.ipAddress;
    license.location = location || license.location;
    license.lastUsedAt = now;
    await license.save();

    res.send({
      ok: true,
      admin: license.admin,
      license: {
        id: license._id,
        type: license.type,
        expiresAt: license.expiresAt,
        deviceName: license.deviceName,
        ipAddress: license.ipAddress,
        location: license.location,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to validate passkey" });
  }
};

module.exports = {
  createInitialPasskeysForAdmin,
  getAdminPasskeys,
  updatePasskey,
  validatePasskey,
};

