const {DataTypes} = require('sequelize');
const sequelize = require('../connection');
const User = require('./User');

const ReadingLog = sequelize.define('ReadingLog', {
  article_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  read_at_utc: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

User.hasMany(ReadingLog);
ReadingLog.belongsTo(User);

module.exports = ReadingLog;
