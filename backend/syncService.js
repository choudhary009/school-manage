const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

// Local models (default mongoose connection is bound to local DB)
const Admin = require("./models/adminSchema");
const Student = require("./models/studentSchema");
const Sclass = require("./models/sclassSchema");
const FeeStructure = require("./models/feeStructureSchema");
const Complain = require("./models/complainSchema");

/**
 * One-way sync: LOCAL MongoDB -> REMOTE MongoDB
 * - Uses local Mongoose models to read data
 * - Uses MongoDB native driver to upsert into remote collections
 */
async function syncLocalToRemote() {
  const remoteUri = process.env.REMOTE_MONGO_URL;
  if (!remoteUri) {
    console.warn("REMOTE_MONGO_URL not set, skipping sync.");
    return;
  }

  // Derive DB name from URI (e.g. .../School?retryWrites...)
  const dbName = (() => {
    try {
      const afterSlash = remoteUri.split("/").pop() || "";
      return (afterSlash.split("?")[0] || "School") || "School";
    } catch {
      return "School";
    }
  })();

  console.log(`[Sync] Starting local -> remote sync to DB "${dbName}"`);

  const client = new MongoClient(remoteUri, {
    serverSelectionTimeoutMS: 8000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);

    // Helper to bulk upsert a collection
    const upsertCollection = async (model, collectionName) => {
      const docs = await model.find().lean();
      if (!docs.length) return;

      const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
      docs.forEach((doc) => {
        bulk
          .find({ _id: doc._id })
          .upsert()
          .replaceOne(doc);
      });
      await bulk.execute();
      console.log(`[Sync] Upserted ${docs.length} documents into ${collectionName}`);
    };

    await upsertCollection(Admin, "admins");
    await upsertCollection(Sclass, "sclasses");
    await upsertCollection(Student, "students");
    await upsertCollection(FeeStructure, "feestructures");
    await upsertCollection(Complain, "complains");

    console.log("[Sync] local -> remote sync completed.");
  } catch (err) {
    console.error("[Sync] Error during sync:", err.message);
  } finally {
    await client.close().catch(() => {});
  }
}

module.exports = {
  syncLocalToRemote,
};

