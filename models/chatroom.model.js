// shared/models/chatRoom.model.js
const { DataTypes } = require('sequelize');
const {sq} = require('../config/connect');


const ChatRoom = sq.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roomType: {
    type: DataTypes.ENUM('one-to-one', 'group'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});



module.exports = ChatRoom;
