// shared/models/message.model.js
const { DataTypes } = require('sequelize');
const {sq} = require('../config/connect');
const ChatRoom = require('./chatroom.model');
const User = require('./user.model');

const Message = sq.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  chatRoomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ChatRoom,
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Associations
Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = Message;
