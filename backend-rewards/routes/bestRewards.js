import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Flag para alternar entre MODO BANCO e MODO MOCK
const USE_DB = process.env.USE_DB === "true";

/*************************************
 * MOCKS – usados quando USE_DB=false
 ************************************/

// Usuários com pontos simulados
const MOCK_USERS = [
  { id: 1, points: 350 },
  { id: 2, points: 120 },
  { id: 3, points: 600 },
];

// Recompensas ativas simuladas
const MOCK_REWARDS = [
  {
    id: 1,
    name: "Desconto 10%",
    description: "Ganhe 10% de desconto.",
    points_cost: 100,
    image_url: "https://via.placeholder.com/150?text=Desconto+10%",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Brinde Exclusivo",
    description: "Brinde especial da campanha.",
    points_cost: 250,
    image_url: "https://via.placeholder.com/150?text=Brinde",
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Frete Grátis",
    description: "Cupom de frete grátis.",
    points_cost: 150,
    image_url: "https://via.placeholder.com/150?text=Frete",
    status: "ACTIVE",
  },
  {
    id: 4,
    name: "Super Brinde Premium",
    description: "Brinde premium para usuários avançados.",
    points_cost: 500,
    image_url: "https://via.placeholder.com/150?text=Premium",
    status: "ACTIVE",
  },
];

/*************************************
 * ROTA PRINCIPAL
 *************************************/
router.get("/user/:id/best-rewards", async (req, res) => {
  const { id } = req.params;

  /**********************************************
   * MODO MOCK (USE_DB=false)
   **********************************************/
  if (!USE_DB) {
    const user = MOCK_USERS.find((u) => u.id == id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado (mock)." });
    }

    const userPoints = user.points;

    const rewards = MOCK_REWARDS.filter((r) => r.status === "ACTIVE");

    const rankedRewards = rewards
      .map((r) => {
        const canRedeem = userPoints >= r.points_cost;
        const difference = r.points_cost - userPoints;
        return {
          ...r,
          canRedeem,
          difference,
          priorityScore: canRedeem ? 0 : difference,
        };
      })
      .sort((a, b) => {
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
      source: "mock",
    });
  }

  /**********************************************
   * MODO BANCO REAL (USE_DB=true)
   **********************************************/
  try {
    // Buscar pontos do usuário
    const [userResult] = await pool.query(
      "SELECT points FROM users WHERE id = ?",
      [id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userPoints = userResult[0].points;

    // Buscar recompensas ativas
    const [rewards] = await pool.query(
      "SELECT id, name, description, points_cost, image_url FROM rewards WHERE status = 'ACTIVE'"
    );

    // Lógica original da dev
    const rankedRewards = rewards
      .map((r) => {
        const canRedeem = userPoints >= r.points_cost;
        const difference = r.points_cost - userPoints;
        return {
          ...r,
          canRedeem,
          difference,
          priorityScore: canRedeem ? 0 : difference,
        };
      })
      .sort((a, b) => {
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
      source: "db",
    });
  } catch (err) {
    console.error("[GET /user/:id/best-rewards] Erro:", err);
    res.status(500).json({
      message: "Erro interno ao buscar melhores recompensas.",
    });
  }
});

export default router;