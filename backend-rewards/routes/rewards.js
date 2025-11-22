import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Flag para decidir se usa banco ou mock
const USE_DB = process.env.USE_DB === "true";

// Dados mocados para demo (sem banco) – IGUAIS AO LAYOUT ANTIGO
const MOCK_REWARDS = [
  // 1. Amazon Prime
  {
    id: 1,
    name: "Amazon Prime",
    description: "1 mês com frete grátis e Prime Video",
    points_cost: 700,
    image_url: "assets/rewards/prime video.png",
  },
  // 2. Cupom iFood
  {
    id: 2,
    name: "Cupom iFood",
    description: "R$ 15 de desconto no seu pedido",
    points_cost: 600,
    image_url: "assets/rewards/ifood.png",
  },
  // 3. Milhas Smiles
  {
    id: 3,
    name: "Milhas no Smiles",
    description: "1000 milhas para suas viagens",
    points_cost: 1600,
    image_url: "assets/rewards/Smiles.png",
  },
  // 4. Spotify Premium
  {
    id: 4,
    name: "Spotify Premium",
    description: "1 mês para ouvir música sem anúncios",
    points_cost: 900,
    image_url: "assets/rewards/spotify.png",
  },
  // 5. Caneca do JC
  {
    id: 5,
    name: "Caneca do JC",
    description: "Edição especial do Jornal do Commercio",
    points_cost: 200,
    image_url: "assets/rewards/Caneca JC.png",
  },
  // 6. Cupom Uber
  {
    id: 6,
    name: "Cupom Uber",
    description: "R$ 30 para suas corridas",
    points_cost: 900,
    image_url: "assets/rewards/uber.png",
  },
  // 7. Cupom Amazon
  {
    id: 7,
    name: "Cupom Amazon",
    description: "R$ 10 de desconto em compras",
    points_cost: 600,
    image_url: "assets/rewards/amazon.png",
  },
  // 8. Cupom Burger King
  {
    id: 8,
    name: "Cupom Burger King",
    description: "R$ 10 de desconto no lanche",
    points_cost: 400,
    image_url: "assets/rewards/burguer king.png",
  },
  // 9. Cupom Subway
  {
    id: 9,
    name: "Cupom Subway",
    description: "R$ 10 de desconto no sanduíche",
    points_cost: 400,
    image_url: "assets/rewards/subway.png",
  },
  // 10. Ingresso de cinema
  {
    id: 10,
    name: "Ingresso de cinema",
    description: "1 ingresso em rede parceira",
    points_cost: 700,
    image_url: "assets/rewards/cinema.png",
  },
  // 11. Vale-livros
  {
    id: 11,
    name: "Vale-livros",
    description: "R$ 30 em livraria online",
    points_cost: 950,
    image_url: "assets/rewards/livraria.png",
  },
  // 12. Globoplay
  {
    id: 12,
    name: "Globoplay",
    description: "1 mês para maratonar suas séries",
    points_cost: 800,
    image_url: "assets/rewards/globoplay.png",
  },
  // 13. Combo Disney+
  {
    id: 13,
    name: "Combo Disney+",
    description:
      "1 mês para assistir conteúdos Disney, Star e ESPN",
    points_cost: 1100,
    image_url: "assets/rewards/disney+.jpeg",
  },
  // 14. Cupom 99
  {
    id: 14,
    name: "Cupom 99",
    description: "R$ 20 de desconto nas corridas",
    points_cost: 750,
    image_url: "assets/rewards/99.jpeg",
  },
  // 15. Pontos LATAM Pass
  {
    id: 15,
    name: "Pontos LATAM Pass",
    description: "700 pontos para suas viagens",
    points_cost: 1200,
    image_url: "assets/rewards/latam.jpeg",
  },
  // 16. Pontos TudoAzul
  {
    id: 16,
    name: "Pontos TudoAzul",
    description: "700 pontos para voar mais",
    points_cost: 1100,
    image_url: "assets/rewards/tudo-azul.png",
  },
  // 17. Cupom Udemy
  {
    id: 17,
    name: "Cupom Udemy",
    description: "50% em cursos selecionados",
    points_cost: 800,
    image_url: "assets/rewards/udemy.png",
  },
  // 18. Acesso Premium redação
  {
    id: 18,
    name: "Acesso Premium",
    description: "30 dias em plataforma de redação",
    points_cost: 900,
    image_url: "assets/rewards/curso-redacao.jpeg",
  },
];

// Lista todas as recompensas ativas
router.get("/rewards", async (req, res) => {
  // MODO MOCK (padrão)
  if (!USE_DB) {
    return res.json({
      count: MOCK_REWARDS.length,
      rewards: MOCK_REWARDS,
      source: "mock",
    });
  }

  // MODO BANCO
  try {
    const [rows] = await pool.query(
      "SELECT id, name, description, points_cost, image_url FROM rewards WHERE status = 'ACTIVE'"
    );

    res.json({
      count: rows.length,
      rewards: rows,
      source: "db",
    });
  } catch (err) {
    console.error("[GET /rewards] Erro:", err);
    res.status(500).json({
      message: "Erro interno ao listar recompensas.",
    });
  }
});

export default router;