const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://user:password@postgres:5432/chat_pro')

module.exports = {sq:sequelize}