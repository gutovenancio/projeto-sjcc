import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/user/:id/best-rewards", async (req, res) => {
  const { id } = req.params;

  try {
    const [userResult] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userPoints = userResult[0].points;

    const [rewards] = await pool.query(
      "SELECT id, name, description, points_cost, image_url FROM rewards WHERE status = 'ACTIVE'"
    );

    const rankedRewards = rewards.map((r) => {
      const canRedeem = userPoints >= r.points_cost;
      const difference = r.points_cost - userPoints;
      return {
        ...r,
        canRedeem,
        difference,
        priorityScore: canRedeem ? 0 : difference,
      };
    });

    rankedRewards.sort((a, b) => {
      if (a.canRedeem && !b.canRedeem) return -1;
      if (!a.canRedeem && b.canRedeem) return 1;
      if (a.priorityScore !== b.priorityScore)
        return a.priorityScore - b.priorityScore;
      return b.points_cost - a.points_cost;
    });

    const bestRewards = rankedRewards.slice(0, 10).map((r) => ({
      id: r.id,
      name: r.name,
      image_url: r.image_url,
      points_cost: r.points_cost,
      canRedeem: r.canRedeem,
      points_needed: r.canRedeem ? 0 : r.difference,
    }));

    return res.json({
      userId: id,
      userPoints,
      bestRewards,
    });
  } catch (err) {
    console.error("[GET /user/:id/best-rewards] Erro:", err);
    res
      .status(500)
      .json({ message: "Erro interno ao buscar melhores recompensas." });
  }
});

export default router;
