const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
// const bodyParser = require("body-parser")

// Load environment variables FIRST - with explicit path
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

// Debug: Check if MONGO_URL is loaded (remove in production)
if (!process.env.MONGO_URL) {
  console.warn("⚠️  Warning: MONGO_URL not found. Checking .env file at:", envPath);
}

const app = express();
const Routes = require("./routes/route.js");
const { syncLocalToRemote } = require("./syncService");

const PORT = process.env.PORT || 5000;

// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Prefer MONGO_URL from env; fallback to local Mongo for offline use
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/schoolmng";
if (!process.env.MONGO_URL) {
  console.warn("⚠️ MONGO_URL not set in .env, using local MongoDB:", mongoUrl);
}

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB (local)");

    // If remote DB configured, start periodic sync (local -> remote)
    if (process.env.REMOTE_MONGO_URL) {
      console.log("🛰  Remote Mongo configured, enabling periodic sync...");
      // Run once shortly after startup
      setTimeout(() => {
        syncLocalToRemote().catch((e) =>
          console.error("[Sync] Initial sync error:", e.message)
        );
      }, 5000);
      // Then run every 5 minutes
      setInterval(() => {
        syncLocalToRemote().catch((e) =>
          console.error("[Sync] Interval sync error:", e.message)
        );
      }, 5 * 60 * 1000);
    }
  })
  .catch((err) => {
    console.error("❌ NOT CONNECTED TO NETWORK", err);
    console.error("MongoDB Connection Error:", err.message);
  });

app.use("/", Routes);

app.listen(PORT, () => {
  console.log(`Server started at port no. ${PORT}`);
});

//School Details Form
const schoolDetailsRoute = require("./routes/schoolDetailsRoute.js");
app.use("/api/schoolDetails", schoolDetailsRoute);

//FeeDetails
const feeDetailsRoute = require("./routes/feeDetailsRoute.js");
app.use("/api/feeDetails", feeDetailsRoute);

const paperRoutes = require("./routes/paperRoutes.js");
app.use("/paper", paperRoutes);
