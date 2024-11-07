// shared/config/database.js
const { sq } = require('../config/connect');

// Define retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

// Initialize Sequelize

//const sequelize = new Sequelize(process.env.DATABASE_URL) // Example for postgres
// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   logging: process.env.LOG_DB || false, // Disable SQL query logging (optional)
// });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load models
const User = require('../models/user.model');
const ChatRoom = require('../models/chatroom.model');
const ChatRoomMembers = require('../models/chat-room-members.model');
const Message = require('../models/message.model');

// Define model associations
const defineAssociations = () => {
  // ChatRoom to Message (One-to-Many)
  ChatRoom.hasMany(Message, { foreignKey: 'chatRoomId' });
  Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId' });

  // ChatRoom to User (Many-to-Many via ChatRoomMembers)
  ChatRoom.belongsToMany(User, { through: ChatRoomMembers, foreignKey: 'chatRoomId' });
  User.belongsToMany(ChatRoom, { through: ChatRoomMembers, foreignKey: 'userId' });

  // You could also set up other relationships if needed, for example:
  // Message to User (One-to-One, if you want to track sender of each message)
  Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
};

// Initialize database connection and synchronize models
const initializeDatabase = async (retries = MAX_RETRIES) => {
  while (retries > 0) {
    try {
      await sq.authenticate();
      console.log('Database connection established.');

      // Define associations
      defineAssociations();

      // Synchronize all defined models
      await sq.sync();

      console.log('Database synchronized successfully.');

      // Handle disconnection events
      sq.connectionManager.on('disconnection', async () => {
        console.warn('Database connection lost. Reconnecting...');
        await initializeDatabase();
      });
      sq.connectionManager.on('error', async (error) => {
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

module.exports = {  initializeDatabase };
