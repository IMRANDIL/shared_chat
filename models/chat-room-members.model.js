// shared/models/chatRoomMembers.model.js
const { DataTypes } = require('sequelize');
const {sq} = require('../config/connect');
const ChatRoom = require('./chatroom.model');
const User = require('./user.model');

const ChatRoomMembers = sq.define('ChatRoomMembers', {
  chatRoomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ChatRoom,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
});



module.exports = ChatRoomMembers;
