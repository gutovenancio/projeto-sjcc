import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/user/:id/top-tags", async (req, res) => {
  const { id } = req.params;

  try {
    const [userCheck] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const [rows] = await pool.query(
      `SELECT n.tags
       FROM user_reads ur
       JOIN news n ON ur.news_id = n.id
       WHERE ur.user_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.json({
        userId: id,
        topTags: [],
        message: "Usuário ainda não leu nenhuma notícia."
      });
    }

    const tagCount = {};

    for (const row of rows) {
      if (!row.tags) continue;

      const tags = JSON.parse(row.tags);
      tags.forEach((tag) => {
        const cleanTag = tag.trim().toLowerCase();
        tagCount[cleanTag] = (tagCount[cleanTag] || 0) + 1;
      });
    }


    const topTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      userId: id,
      topTags,
    });

  } catch (err) {
    console.error("[GET /user/:id/top-tags] Erro:", err);
    res.status(500).json({
      message: "Erro interno ao buscar categorias mais lidas do usuário.",
    });
  }
});

export default router;
