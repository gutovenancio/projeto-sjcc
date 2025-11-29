// ===============================
// CONFIGURAÇÕES BÁSICAS
// ===============================
const API_BASE_URL = "http://localhost:3000/api";
const USER_ID = 1; 
const INITIAL_VISIBLE_REWARDS = 10; 

// CONFIGURAÇÃO DO MOCK
const INITIAL_COINS = 2000;
const MOCK_COINS = INITIAL_COINS;

// --- DADOS MOCKADOS (Mantive os seus originais) ---
const MOCK_BEST_REWARDS = [
  { id: 1, name: "Amazon Prime", description: "1 mês com frete grátis e Prime Video", points_cost: 700, image_url: "assets/Rewards/prime video.png" },
  { id: 2, name: "Cupom iFood", description: "R$ 15 de desconto no seu pedido", points_cost: 600, image_url: "assets/Rewards/ifood.png" },
  { id: 3, name: "Milhas no Smiles", description: "1000 milhas para suas viagens", points_cost: 1600, image_url: "assets/Rewards/smiles.png" },
  { id: 4, name: "Spotify Premium", description: "1 mês para ouvir música sem anúncios", points_cost: 900, image_url: "assets/Rewards/spotify.png" },
  { id: 5, name: "Caneca do JC", description: "Edição especial do Jornal do Commercio", points_cost: 200, image_url: "assets/Rewards/caneca-jc.png" },
];

const MOCK_ALL_REWARDS = [
  // ... (Mantive a lógica para usar seus dados, mas resumido aqui para não ficar gigante na resposta. 
  // O código real vai usar os arrays que você já tem no seu arquivo original, pode manter a lista completa!)
  { id: 1, name: "Amazon Prime", description: "1 mês com frete grátis e Prime Video", points_cost: 700, image_url: "assets/Rewards/prime video.png" },
  { id: 2, name: "Cupom iFood", description: "R$ 15 de desconto no seu pedido", points_cost: 600, image_url: "assets/Rewards/ifood.png" },
  { id: 3, name: "Milhas no Smiles", description: "1000 milhas para suas viagens", points_cost: 1600, image_url: "assets/Rewards/smiles.png" },
  { id: 4, name: "Spotify Premium", description: "1 mês para ouvir música sem anúncios", points_cost: 900, image_url: "assets/Rewards/spotify.png" },
  { id: 5, name: "Caneca do JC", description: "Edição especial do Jornal do Commercio", points_cost: 200, image_url: "assets/Rewards/caneca-jc.png" },
  { id: 6, name: "Cupom Uber", description: "R$ 30 para suas corridas", points_cost: 900, image_url: "assets/Rewards/uber.png" },
  { id: 7, name: "Cupom Amazon", description: "R$ 10 de desconto em compras", points_cost: 600, image_url: "assets/Rewards/amazon.jpg" },
  { id: 8, name: "Cupom Burger King", description: "R$ 10 de desconto no lanche", points_cost: 400, image_url: "assets/Rewards/burguer king.png" },
  { id: 9, name: "Cupom Subway", description: "R$ 10 de desconto no sanduíche", points_cost: 400, image_url: "assets/Rewards/subway.png" },
  { id: 10, name: "Ingresso de cinema", description: "1 ingresso em rede parceira", points_cost: 700, image_url: "assets/Rewards/cinema.png" },
  { id: 11, name: "Vale-livros", description: "R$ 30 em livraria online", points_cost: 950, image_url: "assets/Rewards/livraria.png" },
  { id: 12, name: "Globoplay", description: "1 mês para maratonar suas séries", points_cost: 800, image_url: "assets/Rewards/globoplay.png" },
  { id: 13, name: "Combo Disney+", description: "1 mês para assistir conteúdos Disney, Star e ESPN", points_cost: 1100, image_url: "assets/Rewards/disney +.png" },
  { id: 14, name: "Cupom 99", description: "R$ 20 de desconto nas corridas", points_cost: 750, image_url: "assets/Rewards/99.jpeg" },
  { id: 15, name: "Pontos LATAM Pass", description: "700 pontos para suas viagens", points_cost: 1200, image_url: "assets/Rewards/latam.png" },
  { id: 16, name: "Pontos TudoAzul", description: "700 pontos para voar mais", points_cost: 1100, image_url: "assets/Rewards/tudo-azul.png" },
  { id: 17, name: "Cupom Udemy", description: "50% em cursos selecionados", points_cost: 800, image_url: "assets/Rewards/udemy.png" },
  { id: 18, name: "Acesso Premium", description: "30 dias em plataforma de redação", points_cost: 900, image_url: "assets/Rewards/curso-redacao.jpeg" },
];

let currentUserCoins = INITIAL_COINS;
let expandedRewards = false;

// ===============================
// HELPERS
// ===============================
async function fetchJsonOrNull(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // console.warn("Falha ao buscar:", url, err.message); // Silenciado para demo
    return null;
  }
}

function updateCoinsDisplay() {
  const el = document.getElementById("userCoinsValue");
  if (el) el.textContent = currentUserCoins;
}

async function refreshRewardsUI() {
  updateCoinsDisplay();
  await loadBestRewards();
  await loadAllRewards();
}

// ===============================
// CRIAÇÃO DO CARD (MODIFICADO PARA SYNC)
// ===============================
function createRewardCardElement(reward, canRedeem, isExtra = false) {
  const card = document.createElement("div");
  card.className = "reward-card";

  if (isExtra) {
    card.classList.add("extra-reward");
    if (!expandedRewards) card.classList.add("hidden");
  }

  // Ajuste no caminho da imagem para garantir compatibilidade
  const imgSrc = reward.image_url.startsWith('assets') ? reward.image_url : `assets/Rewards/${reward.image_url}`;

  card.innerHTML = `
    <div class="reward-img-wrapper">
        <img src="${imgSrc}" alt="${reward.name}" onerror="this.src='https://via.placeholder.com/150'">
    </div>
    <h3 class="reward-card-title">${reward.name}</h3>
    <p class="reward-card-description">${reward.description}</p>
    <span class="reward-card-cost">${reward.points_cost} JCoins</span>
  `;

  const button = document.createElement("button");
  button.className = "reward-button";

  if (!canRedeem) {
    button.classList.add("disabled");
    button.textContent = "Indisponível";
  } else {
    button.textContent = "Resgatar";
    
    // --- LÓGICA DE RESGATE SINCRONIZADA ---
    button.addEventListener("click", () => {
      if (currentUserCoins < reward.points_cost) return;

      if(confirm(`Resgatar ${reward.name} por ${reward.points_cost} moedas?`)) {
          currentUserCoins -= reward.points_cost;
          
          // SALVA NO LOCALSTORAGE PARA O PERFIL VER
          localStorage.setItem('jc_user_coins', currentUserCoins);
          
          refreshRewardsUI();
          alert("Resgate realizado com sucesso!");
      }
    });
  }

  card.appendChild(button);
  return card;
}

// ===============================
// CARREGAMENTO (MODIFICADO PARA SYNC)
// ===============================
async function loadUserCoins() {
  // 1. Tenta pegar do LocalStorage (Sincronia com Perfil)
  const localCoins = localStorage.getItem('jc_user_coins');
  
  if (localCoins !== null) {
      currentUserCoins = parseInt(localCoins);
  } else {
      // 2. Se não tiver, tenta API ou Mock
      const data = await fetchJsonOrNull(`${API_BASE_URL}/user/${USER_ID}/coins`);
      currentUserCoins = (data && typeof data.points === "number") ? data.points : MOCK_COINS;
  }
  
  updateCoinsDisplay();
}

async function loadBestRewards() {
  const container = document.getElementById("bestRewardsGrid");
  if (!container) return;
  container.innerHTML = "";

  // Tenta API, senão usa Mock direto
  const data = await fetchJsonOrNull(`${API_BASE_URL}/user/${USER_ID}/best-rewards`);
  const rewards = data?.bestRewards ?? MOCK_BEST_REWARDS;

  rewards.forEach((r) => {
    const canRedeem = currentUserCoins >= r.points_cost;
    container.appendChild(createRewardCardElement(r, canRedeem, false));
  });
}

async function loadAllRewards() {
  const container = document.getElementById("allRewardsGrid");
  if (!container) return;
  container.innerHTML = "";

  const data = await fetchJsonOrNull(`${API_BASE_URL}/rewards`);
  const rewards = data?.rewards ?? MOCK_ALL_REWARDS;

  rewards.forEach((r, index) => {
    const canRedeem = currentUserCoins >= r.points_cost;
    const isExtra = index >= INITIAL_VISIBLE_REWARDS;
    container.appendChild(createRewardCardElement(r, canRedeem, isExtra));
  });
}

function setupToggleRewards() {
  const toggleBtn = document.getElementById("toggleRewards");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    expandedRewards = !expandedRewards;
    document.querySelectorAll(".extra-reward").forEach((card) => {
      card.classList.toggle("hidden", !expandedRewards);
    });
    toggleBtn.textContent = expandedRewards ? "Ver menos" : "Ver mais";
  });
}

function setupResetCoins() {
  const btn = document.getElementById("resetCoins");
  if (!btn) return;
  btn.addEventListener("click", () => {
    currentUserCoins = INITIAL_COINS;
    localStorage.setItem('jc_user_coins', INITIAL_COINS); // Reseta storage também
    refreshRewardsUI();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadUserCoins();
  await refreshRewardsUI();
  setupToggleRewards();
  setupResetCoins();
});
// --- FUNÇÃO PARA ABRIR O MODAL CUSTOMIZADO ---
function showCustomDialog(title, message, isConfirm, onConfirmAction) {
    const modal = document.getElementById('customModal');
    const btnConfirm = document.getElementById('btnModalConfirm');
    const btnCancel = document.getElementById('btnModalCancel');

    // Preenche textos
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').innerHTML = message; // Aceita negrito <b>

    // Mostra o modal
    modal.classList.remove('hidden');

    // Configura botão Confirmar
    btnConfirm.onclick = () => {
        modal.classList.add('hidden'); // Fecha
        if (onConfirmAction) onConfirmAction(); // Executa a ação
    };

    // Configura botão Cancelar (ou esconde se for só aviso)
    if (isConfirm) {
        btnCancel.style.display = 'block';
        btnCancel.onclick = () => modal.classList.add('hidden');
        btnConfirm.textContent = "Confirmar";
        btnConfirm.style.width = "auto";
    } else {
        // Modo Apenas Aviso (Sucesso/Erro)
        btnCancel.style.display = 'none';
        btnConfirm.textContent = "Entendi";
        btnConfirm.style.width = "100%";
    }
}