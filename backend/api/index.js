const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const LOCAL_MONGO_URL =
  process.env.LOCAL_MONGO_URL ||
  process.env.MONGO_URL ||
  "mongodb://localhost:27017/schoolmng";
const REMOTE_MONGO_URL = process.env.REMOTE_MONGO_URL;

async function connectWithFallback() {
  if (REMOTE_MONGO_URL) {
    try {
      await mongoose.connect(REMOTE_MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 8000,
      });
      console.log("Connected to MongoDB (remote)");
      return;
    } catch (err) {
      console.warn(
        "Remote Mongo not reachable, falling back to local. Reason:",
        err?.message || err
      );
    }
  }
  await mongoose.connect(LOCAL_MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 8000,
  });
  console.log("Connected to MongoDB (local)");
}

connectWithFallback().catch((err) => console.log("NOT CONNECTED TO NETWORK", err));

// Routes
const Routes = require("../routes/route.js");
app.use("/", Routes);

//School Details Form
const schoolDetailsRoute = require("../routes/schoolDetailsRoute.js");
app.use("/api/schoolDetails", schoolDetailsRoute);

//FeeDetails
const feeDetailsRoute = require("../routes/feeDetailsRoute.js");
app.use("/api/feeDetails", feeDetailsRoute);

const paperRoutes = require("../routes/paperRoutes.js");
app.use("/paper", paperRoutes);

// For Vercel serverless functions
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started at port no. ${PORT}`);
  });
}

