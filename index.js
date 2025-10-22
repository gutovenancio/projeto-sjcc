// index.js

// --- IMPORTAÇÕES (Todas juntas no topo) ---
const express = require('express');
const cors = require('cors'); // Corrigido: importando o pacote 'cors'
const { Sequelize, DataTypes } = require('sequelize');
const { formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { subDays, format } = require('date-fns');
// --- 2. CONFIGURAÇÃO DO APP (Logo após as importações) ---
const app = express(); // Declarado apenas UMA VEZ
app.use(cors());
app.use(express.json()); // Middleware para interpretar o corpo da requisição como JSON

// --- CONEXÃO COM O BANCO DE DADOS ---
// Conecta ao banco de dados SQLite. O arquivo 'streak.db' será criado.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './streak.db',
  logging: false // Desativa os logs do SQL no console para não poluir
});

// --- MODELAGEM DOS DADOS (Usando Sequelize) ---

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


// --- ENDPOINT PARA CRIAR USUÁRIOS (Para facilitar os testes) ---
app.post('/create_user', async (req, res) => {
  try {
    const { username, timezone } = req.body;
    const newUser = await User.create({ username, timezone });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- ENDPOINT GET PARA CONSULTAR O STREAK DE UM USUÁRIO ---
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

// --- ENDPOINT PRINCIPAL: /streak/increment ---
app.post('/streak/increment', async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    console.log(`[POST /streak/increment] Recebida requisição para userId: ${userId}, articleId: ${articleId}`);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    
    // --- LÓGICA PRINCIPAL ATUALIZADA ---

    // 1. A leitura de um artigo é sempre registrada, independentemente do streak.
    const nowUtc = new Date();
    await ReadingLog.create({
      article_id: articleId,
      read_at_utc: nowUtc,
      UserId: user.id
    });
    
    // 2. Após registrar, contamos o total de leituras para este usuário.
    const totalReads = await ReadingLog.count({ where: { UserId: user.id } });

    // 3. Agora, cuidamos da lógica do streak.
    const userTimezone = user.timezone || 'America/Recife';
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    const [userStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });
    
    // 4. Verificamos se o streak precisa ser atualizado.
    if (userStreak.last_read_date === todayStr) {
      console.log(`[POST /streak/increment] Idempotência de streak: Leitura já registrada hoje para userId: ${userId}.`);
      // Retorna o status de idempotência, mas com o total de leituras atualizado.
      return res.status(200).json({
        status: "Leitura já registrada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak,
        totalReads: totalReads // <--- NOVO
      });
    }

    // 5. Se o streak precisa ser atualizado, calculamos o novo valor.
    const newStreakValue = userStreak.last_read_date === yesterdayStr
      ? userStreak.current_streak + 1
      : 1;

    if (newStreakValue > 1) {
      console.log(`[POST /streak/increment] Streak continuado para userId: ${userId}.`);
    } else {
      console.log(`[POST /streak/increment] Streak iniciado/resetado para userId: ${userId}.`);
    }
      
    await userStreak.update({
      current_streak: newStreakValue,
      last_read_date: todayStr
    });

    // 6. Retornamos a resposta completa com o novo streak e o total de leituras.
    res.status(200).json({
      status: "Leitura registrada com sucesso!",
      userId: user.id,
      current_streak: newStreakValue,
      totalReads: totalReads // <--- NOVO
    });

  } catch (error) {
    console.error("[ERRO em /streak/increment]", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
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