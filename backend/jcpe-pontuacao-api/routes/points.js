const express = require('express');
const router = express.Router();
const PointsService = require('../services/pointsService');


router.post('/news-read', async (req, res) => {
    const { userId } = req.body;
    
    try {
        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }

       
        const streakResult = await PointsService.processUserStreak(userId);
        
        if (!streakResult) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

       
        if (streakResult.streakMessage === 'Atividade já registrada hoje') {
            return res.json({
                success: false,
                message: 'Você já leu uma notícia hoje. Volte amanhã para continuar seu streak!',
                currentStreak: streakResult.newStreak
            });
        }

        
        const [users] = await require('../config/database').pool.execute(
            'SELECT current_level FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userLevel = users[0].current_level;

        
        const newsPoints = PointsService.calculateNewsPoints(userLevel);
        
        
        const totalPointsEarned = newsPoints + streakResult.streakBonus;

        
        const pointsUpdate = await PointsService.updateUserPoints(userId, totalPointsEarned);

     
        await PointsService.logActivity(
            userId, 
            'news_read', 
            newsPoints, 
            `Leitura de notícia - nível ${userLevel}`
        );

        if (streakResult.streakBonus > 0) {
            await PointsService.logActivity(
                userId,
                'streak_bonus',
                streakResult.streakBonus,
                `Bônus de streak - ${streakResult.newStreak} dias`
            );
        }

        res.json({
            success: true,
            pointsEarned: totalPointsEarned,
            breakdown: {
                newsPoints,
                streakBonus: streakResult.streakBonus
            },
            streakMessage: streakResult.streakMessage,
            currentStreak: streakResult.newStreak,
            totalPoints: pointsUpdate.newTotalPoints,
            currentLevel: pointsUpdate.newLevel,
            levelMultiplier: pointsUpdate.levelMultiplier
        });

    } catch (error) {
        console.error('Erro ao registrar leitura:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


router.post('/referral', async (req, res) => {
    const { referrerId, referredEmail } = req.body;
    
    try {
        if (!referrerId || !referredEmail) {
            return res.status(400).json({ error: 'ID do referenciador e email são obrigatórios' });
        }

       
        const [users] = await require('../config/database').pool.execute(
            'SELECT current_level FROM users WHERE id = ?',
            [referrerId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuário referenciador não encontrado' });
        }

        const userLevel = users[0].current_level;

     
        const referralPoints = PointsService.calculateReferralPoints(userLevel);

        
        const pointsUpdate = await PointsService.updateUserPoints(referrerId, referralPoints);

     
        await PointsService.logActivity(
            referrerId,
            'referral',
            referralPoints,
            `Indicação bem-sucedida - ${referredEmail}`
        );

        res.json({
            success: true,
            pointsEarned: referralPoints,
            totalPoints: pointsUpdate.newTotalPoints,
            currentLevel: pointsUpdate.newLevel,
            referredEmail
        });

    } catch (error) {
        console.error('Erro ao processar indicação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


router.get('/user/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await PointsService.getUserStats(userId);
        
        if (!stats) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(stats);

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


router.get('/leaderboard/points', async (req, res) => {
    try {
        const [users] = await require('../config/database').pool.execute(`
            SELECT id, name, email, total_points, current_level, current_streak, longest_streak 
            FROM users 
            ORDER BY total_points DESC, longest_streak DESC 
            LIMIT 20
        `);

        res.json(users);
    } catch (error) {
        console.error('Erro ao obter ranking:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


router.get('/system-info', (req, res) => {
    res.json({
        system: 'Sistema de Pontuação',
        rules: {
            newsRead: {
                basePoints: 1,
                description: 'Pontos por leitura de notícia (com multiplicador de nível)'
            },
            referral: {
                basePoints: 5,
                description: 'Pontos por indicação bem-sucedida (com multiplicador de nível)'
            },
            streakBonuses: {
                7: 3,
                15: 7,
                30: 15,
                60: 30,
                100: 50,
                365: 100
            },
            levelMultipliers: {
                1: 1, 2: 1, 3: 2, 4: 2, 5: 4, 6: 4,
                7: 8, 8: 8, 9: 16, 10: 16
            },
            pointsToReais: '1 real = 20 pontos'
        }
    });
});

module.exports = router;