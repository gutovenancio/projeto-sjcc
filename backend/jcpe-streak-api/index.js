// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');

// --- IMPORTAÇÕES DA NOVA ESTRUTURA MODULAR ---
const rankingRoutes = require('./routes/rankingRoutes');
// AQUI ESTÁ A SUA ROTA NOVA:
const streakRoutes = require('./routes/streakRoutes'); // <--- DESCOMENTE ESTA LINHA

const sequelize = require('./database/connection');
const User = require('./database/models/User');
const UserStreak = require('./database/models/UserStreak');
const ReadingLog = require('./database/models/ReadingLog');

// --- CONFIGURAÇÃO DO APP ---
const app = express();
app.use(cors());
app.use(express.json());

// --- ROTAS ---
app.use('/api', rankingRoutes);
// AQUI VOCÊ ATIVA A SUA ROTA:
app.use('/', streakRoutes); // <--- DESCOMENTE ESTA LINHA (tire as duas barras //)


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;

// Agora o sequelize.sync() vai funcionar porque o arquivo connection.js está preenchido!
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Não foi possível conectar ao banco de dados:', err);
});

module.exports = { app };