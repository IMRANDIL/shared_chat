// shared/models/user.js
const {DataTypes} = require('sequelize')
const { sq } = require('../config/connect');
const Message = require('./message.model');
const ChatRoomMembers = require('./chatRoomMembers.model');

const User = sq.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true, // Optional: adds createdAt and updatedAt fields
});

User.hasMany(Message, { foreignKey: 'senderId', onDelete: 'CASCADE' });
User.hasMany(ChatRoomMembers, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = User;
