import { Router } from "express";
import { pool } from "../db.js";

const router = Router();


router.get("/user/:id/coins", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT points FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userPoints = rows[0].points;

    return res.json({
      userId: id,
      points: userPoints,
    });
  } catch (err) {
    console.error("[GET /user/:id/coins] Erro:", err);
    res.status(500).json({ message: "Erro interno ao buscar saldo de moedas." });
  }
});

export default router;
