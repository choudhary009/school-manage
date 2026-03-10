const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
// const bodyParser = require("body-parser")
const { syncLocalToRemote } = require("./syncService");

// Load environment variables FIRST - with explicit path
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

// Debug: Check if MONGO_URL is loaded (remove in production)
if (!process.env.MONGO_URL) {
  console.warn("⚠️  Warning: MONGO_URL not found. Checking .env file at:", envPath);
}

const app = express();
const Routes = require("./routes/route.js");

const PORT = process.env.PORT || 5000;

// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

app.use(express.json({ limit: "10mb" }));
app.use(cors());

const LOCAL_MONGO_URL =
  process.env.LOCAL_MONGO_URL ||
  process.env.MONGO_URL ||
  "mongodb://localhost:27017/schoolmng";
const REMOTE_MONGO_URL = process.env.REMOTE_MONGO_URL;

let activeDbMode = "unknown"; // "remote" | "local"
let reconnectInProgress = false;

async function connectMongoose(targetUrl, label) {
  // Always close existing connection first
  if (mongoose.connection?.readyState === 1 || mongoose.connection?.readyState === 2) {
    try {
      await mongoose.connection.close();
    } catch (_) {}
  }

  await mongoose.connect(targetUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 8000,
  });

  activeDbMode = label;
  console.log(`✅ Connected to MongoDB (${label})`);
}

async function connectWithAutoSwitch() {
  // Prefer remote when configured
  if (REMOTE_MONGO_URL) {
    try {
      await connectMongoose(REMOTE_MONGO_URL, "remote");
      return;
    } catch (err) {
      console.warn(
        "⚠️ Remote Mongo not reachable, falling back to local. Reason:",
        err?.message || err
      );
    }
  }

  await connectMongoose(LOCAL_MONGO_URL, "local");
}

// Initial connect
connectWithAutoSwitch()
  .then(() => {
    // If local is active and remote exists, keep trying to switch to remote
    if (REMOTE_MONGO_URL) {
      setInterval(async () => {
        if (reconnectInProgress) return;
        if (activeDbMode === "remote") return;
        reconnectInProgress = true;
        try {
          await connectMongoose(REMOTE_MONGO_URL, "remote");
        } catch (_) {
          // still offline / remote unreachable
        } finally {
          reconnectInProgress = false;
        }
      }, 30 * 1000); // every 30 seconds
    }

    // Optional: if local is active, keep syncing local -> remote in background
    if (REMOTE_MONGO_URL) {
      setInterval(() => {
        if (activeDbMode !== "local") return;
        syncLocalToRemote().catch(() => {});
      }, 5 * 60 * 1000);
    }
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

app.use("/", Routes);

// Quick status endpoint (for debugging in Electron/browser)
app.get("/dbStatus", (req, res) => {
  res.json({
    ok: true,
    mode: activeDbMode,
    readyState: mongoose.connection?.readyState,
    hasRemote: !!REMOTE_MONGO_URL,
    hasLocal: !!LOCAL_MONGO_URL,
  });
});

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
