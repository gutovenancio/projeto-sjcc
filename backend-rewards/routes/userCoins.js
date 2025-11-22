import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const USE_DB = process.env.USE_DB === "true";

// Mock de saldo de moedas/coins do usuário
const MOCK_USER_COINS = [
  { id: 1, points: 350 },
  { id: 2, points: 120 },
  { id: 3, points: 600 },
];

// GET /user/:id/coins
router.get("/user/:id/coins", async (req, res) => {
  const { id } = req.params;

  // 🔹 MODO MOCK (padrão, com USE_DB=false)
  if (!USE_DB) {
    const user = MOCK_USER_COINS.find((u) => u.id == id) || {
      id,
      points: 0,
    };

    return res.json({
      userId: Number(id),
      points: user.points,
      source: "mock",
    });
  }

  // 🔹 MODO BANCO REAL (USE_DB=true)
  try {
    const [rows] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userPoints = rows[0].points;

    return res.json({
      userId: Number(id),
      points: userPoints,
      source: "db",
    });
  } catch (err) {
    console.error("[GET /user/:id/coins] Erro:", err);
    res
      .status(500)
      .json({ message: "Erro interno ao buscar saldo de moedas." });
  }
});

export default router;