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
            // (REAL) Buscar dados do usuário (Nome, Email, etc)
            userData,
            // (REAL) Chamada REAL para a API de Streaks
            streakData,
            // (REAL) Buscar indicações
            indicacoesData,
            // (REAL) Buscar pontos
            pontosData,
            // (REAL) Buscar recompensas
            rewardsData

        ] = await Promise.all([
            // [CORRIGIDO] Chamada real
            axios.get(`${API.CADASTRO}/api/user/${userId}`).then(res => res.data).catch(() => ({ usuario: { nome: 'Usuário?', email: 'Não encontrado' } })),
            
            axios.get(`${API.STREAKS}/streak/${userId}`).then(res => res.data).catch(() => ({ current_streak: 0, totalReads: 0 })),
            
            // [CORRIGIDO] Chamada real
            axios.get(`${API.INDICACOES}/api/users/${userId}/invites`).then(res => res.data).catch(() => ({ total: 0 })),

            // [CORRIGIDO] Chamada real
            axios.get(`${API.PONTOS_REWARDS}/points/${userId}`).then(res => res.data).catch((err) => {
                console.error(`[ERRO Profile-API] Falha ao buscar /points/:${userId}. Erro: ${err.message}`);
                return { data: { balance: 0 } }; // <-- Adicionado o 'return'
}),
            // [CORRIGIDO] Chamada real
            axios.get(`${API.PONTOS_REWARDS}/rewards`).then(res => res.data).catch(() => ([])) // Retorna array vazio em caso de falha
        ]);
   
        const profileData = {
            // Vamos montar o objeto 'user' que o frontend espera
            user: {
                id: userData.usuario.id,
                name: userData.usuario.nome,
                email: userData.usuario.email,
                
                // O 'userData.usuario.preferencias' (ou 'prefs') viria da API de cadastro.
                // Como ainda não vem, vamos garantir um array (simulado ou vazio)
                prefs: userData.usuario.prefs || ['Política', 'Economia']
            },
            metrics: {
                newsRead: streakData.totalReads,
                streakDays: streakData.current_streak,
                referrals: indicacoesData.total,
            },
            leveling: {
                userPoints: pontosData.data.balance,
            },
            rewards: {
                available: rewardsData
            },
            ranking: [] // Simulação
        };

        res.status(200).json(profileData);

    } catch (error) {
        console.error("[ERRO em /profile]", error.message);
        res.status(500).json({ error: "Ocorreu um erro ao consolidar os dados do perfil." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Agregador de Perfil rodando na porta ${PORT}`);
});