const express = require('express');
const router = express.Router();
const { formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { subDays, format } = require('date-fns');

// Importamos os modelos que estão na pasta database/models
const User = require('../database/models/User');
const UserStreak = require('../database/models/UserStreak');
const ReadingLog = require('../database/models/ReadingLog');

// --- SUAS ROTAS ORIGINAIS ---

// ENDPOINT PARA CRIAR USUÁRIOS
router.post('/create_user', async (req, res) => {
  try {
    const { username, timezone } = req.body;
    const newUser = await User.create({ username, timezone });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ENDPOINT GET PARA CONSULTAR O STREAK
router.get('/streak/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[GET /streak/:userId] Recebida consulta para userId: ${userId}`);

    // 1. Busca o streak do usuário
    const userStreak = await UserStreak.findOne({
      where: { UserId: userId }
    });

    // 2. Conta o total de leituras do usuário
    const totalReads = await ReadingLog.count({
        where: { UserId: userId }
    });

    // 3. Prepara os valores
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

// ENDPOINT PRINCIPAL: /streak/increment
router.post('/streak/increment', async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    console.log(`[POST /streak/increment] Recebida requisição para userId: ${userId}, articleId: ${articleId}`);

    // 1. Procura o usuário.
    const user = await User.findByPk(userId);

    // 2. Verifica se o usuário NÃO foi encontrado.
    if (!user) {
      console.error(`[ERRO em /streak/increment] Usuário com ID ${userId} não encontrado.`);
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

    // 5. Lógica do streak.
    const userTimezone = user.timezone || 'America/Recife';
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    const [userStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });

    // 6. Verificamos idempotência.
    if (userStreak.last_read_date === todayStr) {
      console.log(`[POST /streak/increment] Idempotência: Leitura já registada hoje.`);
      return res.status(200).json({
        status: "Leitura já registada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak,
        totalReads: totalReads
      });
    }

    // 7. Calculamos o novo streak.
    const newStreakValue = userStreak.last_read_date === yesterdayStr
      ? userStreak.current_streak + 1
      : 1;

    await userStreak.update({
      current_streak: newStreakValue,
      last_read_date: todayStr
    });

    // 8. Retorna a resposta completa
    res.status(200).json({
      status: "Leitura registada com sucesso!",
      userId: user.id,
      current_streak: newStreakValue,
      totalReads: totalReads
    });

  } catch (error) {
    console.error("[ERRO em /streak/increment]", error);
    res.status(500).json({ error: "Erro interno ao processar streak." });
  }
});

module.exports = router;