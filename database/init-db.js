// shared/config/database.js
const { sq } = require("../config/connect");
const { defineAssociations } = require("../models/model-index");

// Define retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load models
require("../models/model-index");

// Initialize database connection and synchronize models
const initializeDatabase = async (retries = MAX_RETRIES) => {
  while (retries > 0) {
    try {
      await sq.authenticate();
      console.log("Database connection established.");

      //define assoc
      defineAssociations();

      // Synchronize all defined models
      await sq.sync({ alter: false });

      console.log("Database synchronized successfully.");

      return; // Exit once connected successfully
    } catch (error) {
      console.error(
        `Database connection failed. Retries left: ${retries - 1}`,
        error
      );
      retries -= 1;

      if (retries === 0) {
        console.error(
          "Max retries reached. Could not connect to the database."
        );
        throw error;
      }

      console.log(
        `Retrying database connection in ${RETRY_DELAY / 1000} seconds...`
      );
      await sleep(RETRY_DELAY);
    }
  }
};

module.exports = { initializeDatabase };
