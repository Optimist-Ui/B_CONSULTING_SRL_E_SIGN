// ./db.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const db = {
  connect: async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      process.exit(1); // Exit process with failure
    }
  },

  close: async () => {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
  },

  // Exporting mongoose instance itself in case you need it elsewhere
  mongoose: mongoose,
};

module.exports = db;
