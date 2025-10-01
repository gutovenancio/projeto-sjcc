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
    // Passo 1: Capturar o ID do usuário que veio na URL.
    // O ':userId' na definição da rota faz com que o valor venha em req.params.
    const { userId } = req.params;

    // Passo 2: Procurar pelo registro de streak daquele usuário no banco de dados.
    // Usamos `findOne` para encontrar um registro que corresponda à condição.
    const userStreak = await UserStreak.findOne({
      where: { UserId: userId }
    });

    // Passo 3: Se nenhum streak for encontrado para o usuário, retorne um erro 404.
    if (!userStreak) {
      return res.status(404).json({ error: 'Nenhum streak encontrado para este usuário.' });
    }

    // Passo 4: Se encontrou, retorne os dados do streak com sucesso.
    res.status(200).json(userStreak);

  } catch (error) {
    // Se algo der errado (ex: problema no banco), retorne um erro genérico 500.
    console.error("Erro ao consultar o streak:", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
});

// --- 4. ENDPOINT PRINCIPAL: /streak/increment ---
app.post('/streak/increment', async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    const userAgent = req.get('User-Agent') || '';

    // --- Regra Antifraude: Ignorar bots ---
    if (/(bot|spider|crawler)/i.test(userAgent)) {
      return res.status(200).json({ status: "Leitura ignorada (bot detectado)." });
    }

    // --- Passo A: Buscar o usuário ---
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // --- Passo B: Determinar as datas no fuso horário do usuário ---
    const userTimezone = user.timezone || 'America/Recife';
    const nowUtc = new Date();
    
    // Formata a data de hoje e ontem como string 'YYYY-MM-DD'
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    // --- Passo C: Verificar idempotência (já leu hoje?) ---
    // Usamos o método findOrCreate para criar um registro de streak se não existir.
    const [userStreak, isNewStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });
    
    if (userStreak.last_read_date === todayStr) {
      return res.status(200).json({
        status: "Leitura já registrada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak
      });
    }

    // --- Passo D: Calcular o novo streak ---
    // Se a última leitura foi ontem, incrementa. Senão, reinicia para 1.
    const newStreakValue = userStreak.last_read_date === yesterdayStr
      ? userStreak.current_streak + 1
      : 1;

    // --- Passo E: Atualizar o streak e salvar o log (em uma transação) ---
    // Uma transação garante que ambas as operações (atualizar streak e criar log)
    // ocorram com sucesso, ou nenhuma delas ocorre. Isso mantém os dados consistentes.
    await sequelize.transaction(async (t) => {
      // Atualiza o streak
      await userStreak.update({
        current_streak: newStreakValue,
        last_read_date: todayStr
      }, { transaction: t });

      // Cria o registro de log
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
    console.error("Erro ao processar o streak:", error);
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