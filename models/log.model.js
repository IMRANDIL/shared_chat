// shared/models/log.js
const { DataTypes } = require('sequelize');
const { sq } = require('../config/connect');

const Log = sq.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('info', 'error', 'warn', 'debug'), // Add any log types you need
    allowNull: false,
  },
  content: {
    type: DataTypes.JSONB, // Stores structured JSON data
    allowNull: false,
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Defaults to current timestamp
  }
}, {
  timestamps: true, // Optional: adds createdAt and updatedAt fields
  paranoid: true, // Optional: allows soft deletes with a deletedAt field if needed
});

module.exports = Log;
