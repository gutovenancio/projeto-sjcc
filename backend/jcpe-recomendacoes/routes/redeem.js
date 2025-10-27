
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();


router.post('/redeem', async (req, res) => {
  const { userId, rewardId } = req.body || {};
  if (!userId || !rewardId) {
    return res.status(400).json({ success: false, message: 'userId e rewardId são obrigatórios' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) pegar reward e checar ativo
    const [[reward]] = await conn.query(
      "SELECT id, name, points_cost AS cost, status FROM rewards WHERE id = ? FOR UPDATE",
      [rewardId]
    );
    if (!reward || reward.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Prêmio inválido ou inativo' });
    }

    // 2) pegar usuário e travar linha p/ evitar corrida
    const [[user]] = await conn.query(
      "SELECT id, points FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // 3) validar saldo
    if (user.points < reward.cost) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Pontos insuficientes' });
    }

    // 4) descontar pontos
    await conn.query(
      "UPDATE users SET points = points - ? WHERE id = ?",
      [reward.cost, userId]
    );

    // 5) registrar no histórico
    await conn.query(
      "INSERT INTO redemptions (user_id, reward_id, cost) VALUES (?, ?, ?)",
      [userId, rewardId, reward.cost]
    );

    await conn.commit();

    const remainingPoints = user.points - reward.cost;
    return res.json({
      success: true,
      message: 'Resgate concluído',
      reward: { id: reward.id, name: reward.name, cost: reward.cost },
      remainingPoints
    });

  } catch (err) {
    // se algo deu ruim, desfaz a transação
    try { await conn.rollback(); } catch {}
    console.error('[POST /redeem] erro:', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  } finally {
    conn.release();
  }
});

export default router;
