// shared/config/database.js
const { Sequelize, DataTypes } = require('sequelize');

// Define retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Disable SQL query logging (optional)
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initializeDatabase = async (retries = MAX_RETRIES) => {
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established.');

      // Handle disconnection events
      sequelize.connectionManager.on('disconnection', async () => {
        console.warn('Database connection lost. Reconnecting...');
        await initializeDatabase();
      });
      sequelize.connectionManager.on('error', async (error) => {
        console.error('Database error encountered:', error);
        await initializeDatabase();
      });

      return; // Exit once connected successfully
    } catch (error) {
      console.error(`Database connection failed. Retries left: ${retries - 1}`, error);
      retries -= 1;

      if (retries === 0) {
        console.error('Max retries reached. Could not connect to the database.');
        throw error;
      }

      console.log(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
      await sleep(RETRY_DELAY);
    }
  }
};

module.exports = { sequelize, initializeDatabase, DataTypes };
