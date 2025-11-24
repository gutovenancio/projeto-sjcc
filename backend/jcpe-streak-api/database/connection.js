const { Sequelize } = require('sequelize');

// Conecta ao banco de dados SQLite. O arquivo 'streak.db' será criado.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  // Importante: ajustar o caminho para que o banco fique na raiz da API
  storage: './streak.db', 
  logging: false // Desativa os logs do SQL no console
});

module.exports = sequelize;