const User = require('./user.model');
const Message = require('./message.model');
const ChatRoom = require('./chatroom.model');
const ChatRoomMembers = require('./chat-room-members.model');

const defineAssociations = () => {
  // User associations
  User.hasMany(Message, { foreignKey: 'senderId', onDelete: 'CASCADE' });
  User.hasMany(ChatRoomMembers, { foreignKey: 'userId', onDelete: 'CASCADE' });

  // Message associations
  Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId' });
  Message.belongsTo(User, { foreignKey: 'senderId'});

  // ChatRoom associations
  ChatRoom.hasMany(Message, { foreignKey: 'chatRoomId', onDelete: 'CASCADE' });
  ChatRoom.hasMany(ChatRoomMembers, { foreignKey: 'chatRoomId', onDelete: 'CASCADE' });

  // ChatRoomMembers associations
  ChatRoomMembers.belongsTo(ChatRoom, { foreignKey: 'chatRoomId' });
  ChatRoomMembers.belongsTo(User, { foreignKey: 'userId' });
};

module.exports = {defineAssociations};
