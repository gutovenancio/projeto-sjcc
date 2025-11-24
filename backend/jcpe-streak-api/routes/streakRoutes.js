const express = require('express');
const router = express.Router();
const { formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { subDays, format } = require('date-fns');

// --- IMPORTAÇÃO DOS MODELOS NOVOS ---
// Note como agora importamos de pastas separadas
const User = require('../database/models/User');
const UserStreak = require('../database/models/UserStreak');
const ReadingLog = require('../database/models/ReadingLog');
// ------------------------------------


// --- SUAS ROTAS ORIGINAIS (Lógica idêntica à sua) ---

// ENDPOINT PARA CRIAR USUÁRIOS
router.post('/create_user', async (req, res) => {
  try {
    const { username, timezone } = req.body;
    // Agora usamos os modelos importados
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

    const userStreak = await UserStreak.findOne({ where: { UserId: userId } });
    const totalReads = await ReadingLog.count({ where: { UserId: userId } });
    const currentStreakValue = userStreak ? userStreak.current_streak : 0;

    console.log(`[GET /streak/:userId] Streak encontrado: ${currentStreakValue}, Total de leituras: ${totalReads}`);
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

    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`[ERRO em /streak/increment] Usuário com ID ${userId} não encontrado.`);
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const nowUtc = new Date();
    await ReadingLog.create({
      article_id: articleId,
      read_at_utc: nowUtc,
      UserId: user.id
    });

    const totalReads = await ReadingLog.count({ where: { UserId: user.id } });

    const userTimezone = user.timezone || 'America/Recife';
    const todayStr = formatInTimeZone(nowUtc, userTimezone, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(toZonedTime(nowUtc, userTimezone), 1), 'yyyy-MM-dd');

    const [userStreak] = await UserStreak.findOrCreate({
      where: { UserId: user.id },
      defaults: { current_streak: 0 }
    });

    if (userStreak.last_read_date === todayStr) {
      console.log(`[POST /streak/increment] Idempotência: Leitura já registada hoje.`);
      return res.status(200).json({
        status: "Leitura já registada para hoje.",
        userId: user.id,
        current_streak: userStreak.current_streak,
        totalReads: totalReads
      });
    }

    const newStreakValue = userStreak.last_read_date === yesterdayStr
      ? userStreak.current_streak + 1
      : 1;

    await userStreak.update({
      current_streak: newStreakValue,
      last_read_date: todayStr
    });

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