const { DataTypes } = require('sequelize');
const sequelize = require('../connection');
const User = require('./User'); // Importa o modelo de usuário para fazer a relação

const UserStreak = sequelize.define('UserStreak', {
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_read_date: {
    type: DataTypes.STRING, 
    allowNull: true
  }
});

// Definindo a Relação
User.hasOne(UserStreak);
UserStreak.belongsTo(User);

module.exports = UserStreak;