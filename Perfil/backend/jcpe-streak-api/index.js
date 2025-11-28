// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');
const { formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { subDays, format } = require('date-fns');
const rankingRoutes = require('./routes/rankingRoutes');
const sequelize = require('./database/connection');
const User = require('./database/models/User');
const UserStreak = require('./database/models/UserStreak');
const ReadingLog = require('./database/models/ReadingLog');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', rankingRoutes);

// --- ENDPOINTS ORIGINAIS (criação, leitura, incremento de streak) ---
// (Mantém exatamente o mesmo código que você já tinha aqui)

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Não foi possível conectar ao banco de dados:', err);
});

module.exports = { app, User, UserStreak, ReadingLog };
