import express from "express";
import cors from "cors";

import rewardsRouter from "./routes/rewards.js";
import bestRewardsRouter from "./routes/bestRewards.js";
import userCoinsRouter from "./routes/userCoins.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas usadas na tela de Catálogo de Recompensas
app.use("/api", rewardsRouter);
app.use("/api", bestRewardsRouter);
app.use("/api", userCoinsRouter);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
