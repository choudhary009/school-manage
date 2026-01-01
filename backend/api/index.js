const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();

dotenv.config();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("NOT CONNECTED TO NETWORK", err));

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

