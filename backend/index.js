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

const PORT = process.env.PORT || 5000;

// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Check if MONGO_URL is defined
const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
  console.error("❌ ERROR: MONGO_URL is not defined in environment variables!");
  console.error("Please check your .env file in the backend folder.");
  console.error("Expected format: MONGO_URL=mongodb+srv://...");
  process.exit(1);
}

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
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
