
// CONFIGURAÇÃO CENTRAL
// Mude USE_MOCK para 'false' se for conectar com o backend Node.js
const CONFIG = {
    USE_MOCK: true,
    API_URL: 'http://localhost:3000/api',
    USER_ID: 1,
    POINTS_PER_BRL: 20,
    XP_PER_LEVEL: 250 
};

// ESTADO DA SIMULAÇÃO (Memória da "Máquina do Tempo")
let SIMULATION_STATE = {
    dayCounter: 1,        // Começamos no Dia 1
    lastReadDay: 0,       // Último dia que o usuário leu (0 = nunca)
    hasReadToday: false   // Se já leu no dia atual da simulação
};

let MOCK_DATA = {
    user: {
        name: "Lucas Oliveira",
        email: "lucas.oliveira@email.com",
        prefs: ["Política", "Economia", "Esportes"],
        avatar: "Foto de Perfil.png"
    },
    metrics: {
        newsRead: 142,
        streakDays: 5,   // Começa com 5 dias de ofensiva para testar
        referrals: 5
    },
    wallet: {
        coins: 850,
        points: 1450
    },
    rewards: [
        { id: 1, title: "Milhas Smiles", desc: "1000 milhas", priceBrl: 30, img: "assets/Rewards/smiles.png" },
        { id: 2, title: "Caneca JC", desc: "Personalizada", priceBrl: 25, img: "assets/Rewards/Caneca JC.png" },
        { id: 3, title: "Netflix R$200", desc: "Voucher mensal", priceBrl: 200, img: "assets/Rewards/Netflix.png" },
        { id: 4, title: "E-book JC", desc: "Economia 2024", priceBrl: 15, img: "assets/Rewards/e-book jc.png" }
    ],
    ranking: [
        { id: 101, name: "Ana Carolina", points: 1500, avatar: "Foto de Perfil.png" },
        { id: 102, name: "Ricardo Mendes", points: 1420, avatar: "Foto de Perfil.png" },
        { id: 103, name: "Maria Julia", points: 1350, avatar: "Foto de Perfil.png" },
        { id: 1, name: "Lucas Oliveira", points: 1250, avatar: "Foto de Perfil.png" },
        { id: 105, name: "Leila Soares", points: 1100, avatar: "Foto de Perfil.png" }
    ],
    recommendations: [
        { id: "n1", title: "Inflação recua no Nordeste e anima comércio local", category: "Economia", img: "https://picsum.photos/seed/economy/80/80" },
        { id: "n2", title: "Sport anuncia novo reforço para a temporada", category: "Esportes", img: "https://picsum.photos/seed/sport/80/80" },
        { id: "n3", title: "Porto Digital abre 500 vagas para cursos gratuitos", category: "Tecnologia", img: "https://picsum.photos/seed/tech/80/80" },
        { id: "n4", title: "Festival de Cinema de PE divulga lista de filmes", category: "Cultura", img: "https://picsum.photos/seed/cine/80/80" }
    ]
};

const DataService = {
    async getProfileData() {
        if (CONFIG.USE_MOCK) return MOCK_DATA;
        try {
            const [userRes, recsRes] = await Promise.all([
                fetch(`${CONFIG.API_URL}/profile/${CONFIG.USER_ID}`),
                fetch(`${CONFIG.API_URL}/recommendations/${CONFIG.USER_ID}`)
            ]);
            return { ...(await userRes.json()), recommendations: (await recsRes.json()).recommended };
        } catch (error) {
            console.error(error);
            return MOCK_DATA;
        }
    }
};

// --- LÓGICA FIEL DE STREAK E LEITURA ---

function simulateReadNews() {
    // 1. Ganha XP e contagem de leitura (sempre acontece)
    MOCK_DATA.wallet.points += 50; 
    MOCK_DATA.metrics.newsRead += 1;

    let mensagemStreak = "";

    // 2. Lógica da Streak (Ofensiva)
    if (!SIMULATION_STATE.hasReadToday) {
        // Usuário está lendo pela primeira vez "hoje"
        
        const diffDays = SIMULATION_STATE.dayCounter - SIMULATION_STATE.lastReadDay;

        if (diffDays === 1) {
            // Leu ontem e leu hoje -> Aumenta Streak!
            MOCK_DATA.metrics.streakDays += 1;
            mensagemStreak = `🔥 Streak aumentou: ${MOCK_DATA.metrics.streakDays} dias!`;
        } else if (diffDays > 1 && SIMULATION_STATE.lastReadDay !== 0) {
            // Pulou um ou mais dias -> Quebrou a streak (Reset)
            MOCK_DATA.metrics.streakDays = 1; // Começa de novo
            mensagemStreak = `💔 Streak perdida! Começando do 1.`;
        } else {
            // Primeira leitura de todas (ou dia 1) -> Mantém ou inicia
             if(MOCK_DATA.metrics.streakDays === 0) MOCK_DATA.metrics.streakDays = 1;
             mensagemStreak = "👍 Leitura registrada.";
        }

        // Marca que já leu hoje para não aumentar streak de novo no mesmo dia
        SIMULATION_STATE.hasReadToday = true;
        SIMULATION_STATE.lastReadDay = SIMULATION_STATE.dayCounter;
    } else {
        mensagemStreak = "📅 Você já leu hoje. Volte amanhã para aumentar a streak.";
    }

    // Feedback Visual
    alert(`+50 XP\n${mensagemStreak}`);
    updateUI(MOCK_DATA);
}

function advanceSimulationDay() {
    SIMULATION_STATE.dayCounter += 1;
    SIMULATION_STATE.hasReadToday = false; // Novo dia, ainda não leu
    
    // Atualiza label na tela
    const debugEl = document.getElementById('debugDayDisplay');
    if(debugEl) debugEl.textContent = `Dia da Simulação: ${SIMULATION_STATE.dayCounter}`;
    
    // Feedback sutil
    const btn = document.getElementById('btnAvancarDia');
    btn.innerHTML = `<i class="fa-solid fa-moon"></i> Noite Passou...`;
    setTimeout(() => {
        btn.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Avançar Dia`;
    }, 1000);
}

// --- RESTANTE DAS FUNÇÕES DE UI (IGUAIS AO ANTERIOR) ---

function handleRedeem(rewardId, cost, title) {
    if (MOCK_DATA.wallet.coins >= cost) {
        if (confirm(`Trocar ${cost} Coins por "${title}"?`)) {
            MOCK_DATA.wallet.coins -= cost;
            updateUI(MOCK_DATA);
            alert(`Sucesso! Saldo: ${MOCK_DATA.wallet.coins}`);
        }
    } else {
        alert(`Faltam ${cost - MOCK_DATA.wallet.coins} Coins.`);
    }
}

function calculateLevelInfo(totalPoints) {
    const level = Math.floor(totalPoints / CONFIG.XP_PER_LEVEL) + 1;
    const nextLevelPoints = level * CONFIG.XP_PER_LEVEL;
    const prevLevelPoints = (level - 1) * CONFIG.XP_PER_LEVEL;
    const progress = ((totalPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;
    return { level, nextLevelPoints, progress };
}

function renderLevel(points) {
    const { level, nextLevelPoints, progress } = calculateLevelInfo(points);
    document.getElementById('levelLabel').textContent = `Nível ${level}`;
    document.getElementById('pointsRight').textContent = `${points} / ${nextLevelPoints} pts`;
    document.getElementById('nextLevelHint').textContent = `Faltam ${nextLevelPoints - points} pontos para o Nível ${level + 1}`;
    const bar = document.getElementById('levelBar');
    if (bar) {
        bar.style.width = `${progress}%`;
        bar.style.backgroundColor = '#B00000'; 
    }
}

function updateUI(data) {
    document.getElementById('userName').textContent = data.user.name;
    document.getElementById('userEmail').textContent = data.user.email;
    document.getElementById('walletCoins').textContent = `${data.wallet.coins} JC Coins`;
    document.querySelectorAll('.user-avatar, .app-avatar').forEach(img => img.src = data.user.avatar);
    
    const prefs = document.getElementById('userPrefs');
    if(prefs) prefs.innerHTML = data.user.prefs.map(p => `<span class="chip">${p}</span>`).join('');

    document.getElementById('metricNews').textContent = data.metrics.newsRead;
    document.getElementById('metricStreak').textContent = data.metrics.streakDays;
    document.getElementById('metricReferrals').textContent = data.metrics.referrals;

    renderLevel(data.wallet.points);
    renderRewards(data.rewards, data.wallet.coins);
    renderRanking(data.ranking);
    renderRecommendations(data.recommendations || []);
}

function renderRewards(rewards, userCoins) {
    const list = document.getElementById('rewardsList');
    if(!list) return;
    list.innerHTML = '';
    rewards.forEach(r => {
        const cost = Math.round(r.priceBrl * CONFIG.POINTS_PER_BRL);
        const canRedeem = userCoins >= cost;
        const li = document.createElement('li');
        li.className = `reward ${canRedeem ? 'can-redeem' : 'locked'}`;
        li.innerHTML = `
            <div class="reward-info">
                <img src="${r.img}" class="reward-logo" onerror="this.src='https://via.placeholder.com/50'">
                <div><h4>${r.title}</h4><p>${r.desc}</p></div>
            </div>
            <div class="reward-cta">
                <span class="price-line"><b class="jcoin-value">${cost}</b> <span class="jcoin-label">JCoins</span></span>
                <span class="badge status ${canRedeem ? 'success' : 'locked'}">${canRedeem ? 'Disponível' : 'Faltam ' + (cost - userCoins)}</span>
                <button class="redeem-btn ${!canRedeem ? 'disabled' : ''}" ${!canRedeem ? 'disabled' : ''}>Resgatar</button>
            </div>`;
        if (canRedeem) li.querySelector('button').onclick = () => handleRedeem(r.id, cost, r.title);
        list.appendChild(li);
    });
}

function renderRanking(listData) {
    const list = document.getElementById('rankingList');
    if(!list) return;
    list.innerHTML = '';
    const medals = ['medal-1.png', 'medal-2.png', 'medal-3.png'];
    listData.sort((a, b) => b.points - a.points).forEach((p, i) => {
        const isMe = p.id === CONFIG.USER_ID;
        const rankDisplay = i < 3 ? `<img class="rank-medal" src="assets/icons/${medals[i]}">` : `<span class="rank-num">${i + 1}º</span>`;
        list.innerHTML += `<li class="${isMe ? 'me' : ''}"><div class="rank-pos">${rankDisplay}</div><img class="rank-photo" src="${p.avatar}"><span class="rank-name">${p.name} ${isMe ? '(Você)' : ''}</span><b class="rank-score">${p.points} 🔥</b></li>`;
    });
}

function renderRecommendations(recs) {
    const list = document.getElementById('rec-list');
    if(!list) return;
    list.innerHTML = '';
    recs.forEach((r, i) => {
        list.innerHTML += `<li class="rec-item"><div class="rec-index">${i+1}</div><div class="rec-body"><a href="#" class="rec-link">${r.title}</a><span class="rec-tag">${r.category}</span></div><img class="rec-thumb" src="${r.img || 'https://via.placeholder.com/80'}"></li>`;
    });
}

async function init() {
    const data = await DataService.getProfileData();
    if(data) {
        // Inicializa o estado da simulação com o que veio do banco/mock
        SIMULATION_STATE.lastReadDay = 0; // Reset para demo

        updateUI(data);
        
        // Conecta os botões
        const btnLeitura = document.getElementById('btnSimularLeitura');
        if(btnLeitura) btnLeitura.onclick = simulateReadNews;

        const btnDia = document.getElementById('btnAvancarDia');
        if(btnDia) btnDia.onclick = advanceSimulationDay;
    }
}

document.addEventListener('DOMContentLoaded', init);