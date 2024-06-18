const express = require("express");
const mongoose = require("mongoose");
const { mongoURI } = require("./config");
const authRoutes = require("./routes/authRoutes");
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
// Routes
app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
