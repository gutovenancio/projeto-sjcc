// index.js

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const { formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { subDays, format } = require('date-fns');
const app = express();
app.use(express.json()); // Middleware para interpretar o corpo da requisição como JSON

// Conecta ao banco de dados SQLite. O arquivo 'streak.db' será criado.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './streak.db',
  logging: false // Desativa os logs do SQL no console para não poluir
});

// --- 2. MODELAGEM DOS DADOS (Usando Sequelize) ---

// Tabela de Usuários
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

// Tabela para o Streak do Usuário
const UserStreak = sequelize.define('UserStreak', {
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_read_date: {
    // Armazenamos a data no formato 'YYYY-MM-DD' no fuso do usuário
    type: DataTypes.STRING, 
    allowNull: true
  }
});

// Tabela de Log de Leituras (para auditoria)
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

// Definindo as Relações entre as tabelas
User.hasOne(UserStreak);
UserStreak.belongsTo(User);

User.hasMany(ReadingLog);
ReadingLog.belongsTo(User);


// --- 3. ENDPOINT PARA CRIAR USUÁRIOS (Para facilitar os testes) ---
app.post('/create_user', async (req, res) => {
  try {
    const { username, timezone } = req.body;
    const newUser = await User.create({ username, timezone });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- 5. ENDPOINT GET PARA CONSULTAR O STREAK DE UM USUÁRIO ---
app.get('/streak/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // --- NOVO LOG 1: Avisa quando a requisição chegou ---
    console.log(`[GET /streak/:userId] Recebida consulta para userId: ${userId}`);

    const userStreak = await UserStreak.findOne({
      where: { UserId: userId }
    });

    if (!userStreak) {
      // --- NOVO LOG 2: Avisa que o usuário não foi encontrado ---
      console.log(`[GET /streak/:userId] Nenhum streak encontrado para userId: ${userId}. Retornando 404.`);
      return res.status(404).json({ error: 'Nenhum streak encontrado para este usuário.' });
    }

    // --- NOVO LOG 3: Avisa que encontrou e qual o valor ---
    console.log(`[GET /streak/:userId] Streak encontrado para userId: ${userId}. Valor: ${userStreak.current_streak}`);
    res.status(200).json(userStreak);

  } catch (error) {
    // Adicionando um identificador ao log de erro.
    console.error("[ERRO em /streak/:userId]", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
});

// --- 4. ENDPOINT PRINCIPAL: /streak/increment ---
app.post('/streak/increment', async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    // --- NOVO LOG 1: Avisa quando a requisição chegou ---
    console.log(`[POST /streak/increment] Recebida requisição para userId: ${userId}, articleId: ${articleId}`);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const userTimezone = user.timezone || 'America/Recife';
    const nowUtc = new Date();
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    const [userStreak, isNewStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });
    
    if (userStreak.last_read_date === todayStr) {
      // --- NOVO LOG 2: Avisa sobre a regra de idempotência ---
      console.log(`[POST /streak/increment] Idempotência: Leitura já registrada hoje para userId: ${userId}.`);
      return res.status(200).json({
        status: "Leitura já registrada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak
      });
    }

    const newStreakValue = userStreak.last_read_date === yesterdayStr
      ? userStreak.current_streak + 1
      : 1;

    // --- NOVO LOG 3: Informa o que aconteceu com o streak ---
    if (newStreakValue > 1) {
      console.log(`[POST /streak/increment] Streak continuado para userId: ${userId}. Novo streak: ${newStreakValue}`);
    } else {
      console.log(`[POST /streak/increment] Streak iniciado/resetado para userId: ${userId}.`);
    }
      
    await sequelize.transaction(async (t) => {
      await userStreak.update({
        current_streak: newStreakValue,
        last_read_date: todayStr
      }, { transaction: t });

      await ReadingLog.create({
        article_id: articleId,
        read_at_utc: nowUtc,
        UserId: user.id
      }, { transaction: t });
    });

    res.status(200).json({
      status: "Leitura registrada com sucesso!",
      userId: user.id,
      current_streak: newStreakValue
    });

  } catch (error) {
    // Este console.error nós já tínhamos, o que é ótimo! Apenas adicionei um identificador.
    console.error("[ERRO em /streak/increment]", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
});


// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;

// Sincroniza os modelos com o banco de dados e então inicia o servidor
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Não foi possível conectar ao banco de dados:', err);
});