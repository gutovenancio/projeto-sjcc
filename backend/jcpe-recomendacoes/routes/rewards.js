import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

//Lista todas as recompensas ativas

router.get("/rewards", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, description, points_cost, image_url FROM rewards WHERE status = 'ACTIVE'"
    );

    res.json({
      count: rows.length,
      rewards: rows,
    });
  } catch (err) {
    console.error("[GET /rewards] Erro:", err);
    res.status(500).json({
      message: "Erro interno ao listar recompensas.",
    });
  }
});