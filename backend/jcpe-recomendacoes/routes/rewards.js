import { Router } from "express";
import { pool } from "../db.js";

const router = Router();


router.get("/recommendations/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    
    const [reads] = await pool.query(
      `SELECT n.tags 
         FROM user_reads ur 
         JOIN news n ON ur.news_id = n.id
        WHERE ur.user_id = ?
        ORDER BY ur.read_at DESC
        LIMIT 10`,
      [userId]
    );

    
    const tagCounts = {};
    reads.forEach((r) => {
      try {
        const tags = JSON.parse(r.tags || "[]");
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      } catch {}
    });

    
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    let recommended = [];

    
    if (topTags.length > 0) {
      const conditions = topTags.map(() => "JSON_CONTAINS(n.tags, ?)").join(" OR ");
      const params = topTags.map((t) => JSON.stringify([t]));

      const [rows] = await pool.query(
        `SELECT n.id, n.title, n.tags, n.created_at
           FROM news n
          WHERE (${conditions})
            AND n.id NOT IN (SELECT news_id FROM user_reads WHERE user_id = ?)
          ORDER BY n.created_at DESC
          LIMIT 5`,
        [...params, userId]
      );
      recommended = rows;
    }

  
    if (recommended.length < 3) {
      const [fallback] = await pool.query(
        `SELECT id, title, tags, created_at
           FROM news
          ORDER BY created_at DESC
          LIMIT ?`,
        [3 - recommended.length]
      );
      recommended = [...recommended, ...fallback];
    }

    res.json({
      userId: Number(userId),
      count: recommended.length,
      recommended,
    });
  } catch (err) {
    console.error("[GET /recommendations] erro:", err);
    res.status(500).json({
      success: false,
      message: "Erro interno ao gerar recomendações",
    });
  }
});

export default router;
