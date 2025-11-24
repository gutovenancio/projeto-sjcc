const { pool } = require('../config/database');

/**
 * Calcula a quantidade de notícias lidas recentemente por um usuário
 * @param {number} userId - ID do usuário
 * @param {number} daysInterval - Período em dias (padrão: 7)
 * @returns {Object} - Objeto com total de leituras e data da última leitura
 */
async function getRecentReads(userId, daysInterval = 7) {
    const connection = await pool.getConnection();
    
    try {
        
        const [userRows] = await connection.execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (userRows.length === 0) {
            return { error: 'Usuário não encontrado' };
        }
        
      
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysInterval);
        
        
        const [readRows] = await connection.execute(
            `SELECT COUNT(*) as total_reads, MAX(read_at) as last_read
             FROM user_reads 
             WHERE user_id = ? AND read_at >= ?`,
            [userId, startDate]
        );
        
        const result = {
            user_id: parseInt(userId),
            recent_reads: readRows[0].total_reads || 0,
            period_days: daysInterval,
            last_read: readRows[0].last_read || null,
            period_start: startDate.toISOString()
        };
        
        return result;
        
    } catch (error) {
        console.error('Erro ao buscar leituras recentes:', error);
        return { error: 'Erro interno do servidor' };
    } finally {
        connection.release();
    }
}


async function getUserRecentReads(req, res) {
    const userId = req.params.id;
    const daysInterval = parseInt(req.query.days) || 7;
    
    
    if (!userId || isNaN(userId)) {
        return res.status(400).json({
            error: 'ID do usuário inválido'
        });
    }
    
    
    if (daysInterval < 1 || daysInterval > 365) {
        return res.status(400).json({
            error: 'Intervalo de dias deve estar entre 1 e 365'
        });
    }
    
    const result = await getRecentReads(userId, daysInterval);
    
    if (result.error) {
        return res.status(404).json(result);
    }
    
    res.json({
        success: true,
        data: result
    });
}


 
 
async function registerUserRead(userId, newsId) {
    const connection = await pool.getConnection();
    
    try {
        await connection.execute(
            'INSERT INTO user_reads (user_id, news_id) VALUES (?, ?)',
            [userId, newsId]
        );
        
        return { success: true, message: 'Leitura registrada com sucesso' };
    } catch (error) {
        console.error('Erro ao registrar leitura:', error);
        return { error: 'Erro ao registrar leitura' };
    } finally {
        connection.release();
    }
}

module.exports = {
    getRecentReads,
    getUserRecentReads,
    registerUserRead
};