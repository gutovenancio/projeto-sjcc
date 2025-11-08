// backend/jcpe-profile-api/index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // Usando o CORS simples por enquanto
app.use(express.json()); // Adicionado para garantir

const PORT = 4000;

// Endereços das nossas APIs
const API = {
    STREAKS: 'http://localhost:3000',
    CADASTRO: 'http://localhost:3001',
    INDICACOES: 'http://localhost:3002',
    PONTOS_REWARDS: 'http://localhost:3003'
};

// --- ENDPOINT AGREGADO (GET /profile/:userId) ---
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log(`[GET /profile] Buscando dados consolidados para userId: ${userId}`);

    try {
        const [
            // (Simulação de usuário)
            userData,
            // Chamada REAL para a API de Streaks
            streakData,
            // (Simulação de indicações)
            indicacoesData,
            // (Simulação de pontos)
            pontosData,
            // (Simulação de recompensas)
            rewardsData

        ] = await Promise.all([
            Promise.resolve({ data: { id: userId, nome: 'Lucas Oliveira (Teste)', email: 'lucas.teste@email.com', preferencias: ['Política', 'Economia'] } }),
            axios.get(`${API.STREAKS}/streak/${userId}`).then(res => res.data).catch(() => ({ current_streak: 0, totalReads: 0 })),
            Promise.resolve({ total: 5 }), // Simulação
            Promise.resolve({ data: { balance: 2350 } }), // Simulação
            Promise.resolve({ data: [] }) // Simulação
        ]);

        const profileData = {
            user: userData.data,
            metrics: {
                newsRead: streakData.totalReads,
                streakDays: streakData.current_streak,
                referrals: indicacoesData.total,
            },
            leveling: {
                userPoints: pontosData.data.balance,
            },
            rewards: {
                available: rewardsData.data
            },
            ranking: [] // Simulação
        };

        res.status(200).json(profileData);

    } catch (error) {
        console.error("[ERRO em /profile]", error);
        res.status(500).json({ error: "Ocorreu um erro ao consolidar os dados do perfil." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Agregador de Perfil rodando na porta ${PORT}`);
});