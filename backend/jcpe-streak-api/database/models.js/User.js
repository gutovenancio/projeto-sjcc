const {DataTypes} = require('sequelize');
const sequelize = require('../connection');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'America/Recife'
  }
});

module.exports = User;
