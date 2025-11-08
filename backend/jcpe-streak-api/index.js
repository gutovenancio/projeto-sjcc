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
    console.log(`[GET /streak/:userId] Recebida consulta para userId: ${userId}`);

    // --- LÓGICA DO CÓDIGO ---
    
    // 1. Busca o streak do usuário
    const userStreak = await UserStreak.findOne({
      where: { UserId: userId }
    });
    
    // 2. Conta o total de leituras do usuário
    const totalReads = await ReadingLog.count({
        where: { UserId: userId }
    });

    // 3. Prepara os valores para a resposta
    // Se não houver streak, o valor é 0.
    const currentStreakValue = userStreak ? userStreak.current_streak : 0;

    console.log(`[GET /streak/:userId] Streak encontrado: ${currentStreakValue}, Total de leituras: ${totalReads}`);
    
    // 4. Retorna AMBAS as informações
    res.status(200).json({
        current_streak: currentStreakValue,
        totalReads: totalReads
    });

  } catch (error) {
    console.error("[ERRO em /streak/:userId]", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
});

// --- ENDPOINT PRINCIPAL: /streak/increment ---
app.post('/streak/increment', async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    console.log(`[POST /streak/increment] Recebida requisição para userId: ${userId}, articleId: ${articleId}`);

    // --- LÓGICA REVERTIDA E CORRIGIDA ---
    // 1. Procura o usuário.
    const user = await User.findByPk(userId);

    // 2. CORREÇÃO DO BUG: Verifica se o usuário NÃO foi encontrado.
    if (!user) {
      console.error(`[ERRO em /streak/increment] Usuário com ID ${userId} não encontrado no banco de dados de streaks.`);
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    
    // 3. A leitura de um artigo é sempre registada
    const nowUtc = new Date();
    await ReadingLog.create({
      article_id: articleId,
      read_at_utc: nowUtc,
      UserId: user.id
    });
    
    // 4. Após registar, contamos o total de leituras
    const totalReads = await ReadingLog.count({ where: { UserId: user.id } });

    // 5. Agora, cuidamos da lógica do streak.
    const userTimezone = user.timezone || 'America/Recife';
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    const [userStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });
    
    // 6. Verificamos se o streak precisa ser atualizado.
    if (userStreak.last_read_date === todayStr) {
      console.log(`[POST /streak/increment] Idempotência de streak: Leitura já registada hoje para userId: ${userId}.`);
      return res.status(200).json({
        status: "Leitura já registada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak,
        totalReads: totalReads
      });
    }

    // 7. Se o streak precisa ser atualizado, calculamos o novo valor.
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

    // 8. Retornamos a resposta completa
    res.status(200).json({
      status: "Leitura registada com sucesso!",
      userId: user.id,
      current_streak: newStreakValue,
      totalReads: totalReads
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