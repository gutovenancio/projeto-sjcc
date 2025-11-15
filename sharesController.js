
const pool = require('./db');


async function recordShareEvent(user_id, news_id) {
  if (!user_id || !news_id) return { success: false, error: 'user_id e news_id obrigatórios' };
  try {
    const sql = 'INSERT INTO user_shares (user_id, news_id) VALUES (?, ?)';
    const [result] = await pool.execute(sql, [user_id, news_id]);
    return { success: true, insertId: result.insertId };
  } catch (err) {
    console.error('recordShareEvent error:', err);
    return { success: false, error: 'Erro ao gravar no banco' };
  }
}


async function getTotalSharesByUser(user_id) {
  if (!user_id) return { success: false, error: 'user_id obrigatório' };
  try {
    const sql = 'SELECT COUNT(*) AS total FROM user_shares WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [user_id]);
    return { success: true, total: rows[0].total };
  } catch (err) {
    console.error('getTotalSharesByUser error:', err);
    return { success: false, error: 'Erro ao consultar banco' };
  }
}


async function getTotalSharesByNews(news_id) {
  if (!news_id) return { success: false, error: 'news_id obrigatório' };
  try {
    const sql = 'SELECT COUNT(*) AS total FROM user_shares WHERE news_id = ?';
    const [rows] = await pool.execute(sql, [news_id]);
    return { success: true, total: rows[0].total };
  } catch (err) {
    console.error('getTotalSharesByNews error:', err);
    return { success: false, error: 'Erro ao consultar banco' };
  }
}

module.exports = {
  recordShareEvent,
  getTotalSharesByUser,
  getTotalSharesByNews
};
