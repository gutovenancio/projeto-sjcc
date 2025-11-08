// server.js (MySQL)
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// garante que o usuário exista
async function ensureUser(conn, userId) {
  const [rows] = await conn.query('SELECT user_id FROM user_points WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await conn.query('INSERT INTO user_points (user_id, balance) VALUES (?, 0)', [userId]);
  }
}

// listar prêmios
app.get('/rewards', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, cost_points, stock, is_active FROM rewards ORDER BY id ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// registrar troca
app.post('/redeem', async (req, res) => {
  const { userId, rewardId, quantity } = req.body || {};
  const qty = Math.max(1, parseInt(quantity || 1, 10));

  if (!userId || !rewardId) {
    return res.status(400).json({ error: 'missing_fields', detail: 'userId e rewardId são obrigatórios' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // trava linhas relevantes
    const [rewardRows] = await conn.query(
      'SELECT id, title, cost_points, stock, is_active FROM rewards WHERE id = ? FOR UPDATE',
      [rewardId]
    );
    if (rewardRows.length === 0 || rewardRows[0].is_active !== 1) {
      await conn.rollback();
      return res.status(404).json({ error: 'reward_not_found_or_inactive' });
    }
    const reward = rewardRows[0];

    if (reward.stock !== null && reward.stock < qty) {
      await conn.rollback();
      return res.status(409).json({ error: 'insufficient_stock' });
    }

    await ensureUser(conn, userId);

    const [userRows] = await conn.query(
      'SELECT balance FROM user_points WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const balanceBefore = userRows[0]?.balance ?? 0;

    const totalCost = reward.cost_points * qty;
    if (balanceBefore < totalCost) {
      await conn.rollback();
      return res.status(409).json({ error: 'insufficient_points', needed: totalCost, have: balanceBefore });
    }

   // debita pontos (sem updated_at)
await conn.query(
  'UPDATE user_points SET balance = balance - ? WHERE user_id = ?',
  [totalCost, userId]
);

  // baixa estoque se finito (sem updated_at)
if (reward.stock !== null) {
  await conn.query(
    'UPDATE rewards SET stock = stock - ? WHERE id = ?',
    [qty, reward.id]
  );
}

    // grava histórico
    const [ins] = await conn.query(
      `INSERT INTO redeem_history (user_id, reward_id, quantity, points_spent, balance_before, balance_after)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, reward.id, qty, totalCost, balanceBefore, balanceBefore - totalCost]
    );

    // saldo após
    const [afterRows] = await conn.query('SELECT balance FROM user_points WHERE user_id = ?', [userId]);
    const balanceAfter = afterRows[0].balance;

    await conn.commit();

    res.json({
      ok: true,
      redemptionId: ins.insertId,
      userId,
      reward: { id: reward.id, title: reward.title },
      quantity: qty,
      pointsSpent: totalCost,
      balanceBefore,
      balanceAfter
    });
  } catch (e) {
    console.error(e);
    await conn.rollback();
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
