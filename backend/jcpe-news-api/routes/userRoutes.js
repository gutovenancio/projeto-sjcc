const express = require('express');
const router = express.Router();
const { getUserRecentReads, registerUserRead } = require('../controllers/userController');

/**
 * @route GET /user/:id/recent-reads
 * @description Obtém a quantidade de notícias lidas recentemente por um usuário
 * @param {number} id - ID do usuário
 * @query {number} [days=7] - Período em dias (opcional, padrão: 7)
 * @returns {Object} - Quantidade de leituras recentes e data da última leitura
 */
router.get('/:id/recent-reads', getUserRecentReads);

/**
 * @route POST /user/:id/read
 * @description Registra uma leitura para o usuário (para testes)
 * @param {number} id - ID do usuário
 * @body {number} news_id - ID da notícia
 */
router.post('/:id/read', async (req, res) => {
    const userId = req.params.id;
    const { news_id } = req.body;
    
    if (!news_id) {
        return res.status(400).json({ error: 'news_id é obrigatório' });
    }
    
    const result = await registerUserRead(userId, news_id);
    
    if (result.error) {
        return res.status(400).json(result);
    }
    
    res.json(result);
});

module.exports = router;