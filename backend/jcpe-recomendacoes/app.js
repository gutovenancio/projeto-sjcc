import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import rewardsRouter from "./routes/rewards.js";
import redeemRouter from "./routes/redeem.js";
import recommendationsRouter from "./routes/recommendations.js";
import bestRewardsRouter from "./routes/bestRewards.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", rewardsRouter);
app.use("/api", redeemRouter);
app.use("/api", recommendationsRouter);
app.use("/api", bestRewardsRouter);
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

