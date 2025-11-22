document.addEventListener("DOMContentLoaded", async () => {
  const bestRewardsGrid = document.getElementById("bestRewardsGrid");
  const allRewardsGrid = document.getElementById("allRewardsGrid");
  const balanceValue = document.querySelector(".reward-balance-card__value");
  const toggleBtn = document.getElementById("toggleRewards");

  const API_BASE_URL = "http://localhost:3000/api";

  // ---------------- MOCKS (usados só se o fetch falhar) ----------------
  const MOCK_USER_POINTS = 500; // mesmo valor que aparece no layout

  const MOCK_REWARDS = [
    {
      id: 1,
      name: "Amazon Prime",
      description: "1 mês com frete grátis e Prime Video",
      points_cost: 700,
      image_url: "assets/rewards/prime video.png",
    },
    {
      id: 2,
      name: "Cupom iFood",
      description: "R$ 15 de desconto no seu pedido",
      points_cost: 600,
      image_url: "assets/rewards/ifood.png",
    },
    {
      id: 3,
      name: "Milhas no Smiles",
      description: "1000 milhas para suas viagens",
      points_cost: 1600,
      image_url: "assets/rewards/Smiles.png",
    },
    {
      id: 4,
      name: "Spotify Premium",
      description: "1 mês para ouvir música sem anúncios",
      points_cost: 900,
      image_url: "assets/rewards/spotify.png",
    },
    {
      id: 5,
      name: "Caneca do JC",
      description: "Edição especial do Jornal do Commercio",
      points_cost: 200,
      image_url: "assets/rewards/Caneca JC.png",
    },
    {
      id: 6,
      name: "Cupom Uber",
      description: "R$ 30 para suas corridas",
      points_cost: 900,
      image_url: "assets/rewards/uber.png",
    },
    {
      id: 7,
      name: "Cupom Amazon",
      description: "R$ 10 de desconto em compras",
      points_cost: 600,
      image_url: "assets/rewards/amazon.png",
    },
    {
      id: 8,
      name: "Cupom Burger King",
      description: "R$ 10 de desconto no lanche",
      points_cost: 400,
      image_url: "assets/rewards/burguer king.png",
    },
    {
      id: 9,
      name: "Cupom Subway",
      description: "R$ 10 de desconto no sanduíche",
      points_cost: 400,
      image_url: "assets/rewards/subway.png",
    },
    {
      id: 10,
      name: "Ingresso de cinema",
      description: "1 ingresso em rede parceira",
      points_cost: 700,
      image_url: "assets/rewards/cinema.png",
    },
    {
      id: 11,
      name: "Vale-livros",
      description: "R$ 30 em livraria online",
      points_cost: 950,
      image_url: "assets/rewards/livraria.png",
    },
    {
      id: 12,
      name: "Globoplay",
      description: "1 mês para maratonar suas séries",
      points_cost: 800,
      image_url: "assets/rewards/globoplay.png",
    },
    {
      id: 13,
      name: "Combo Disney+",
      description:
        "1 mês para assistir conteúdos Disney, Star e ESPN",
      points_cost: 1100,
      image_url: "assets/rewards/disney+.jpeg",
    },
    {
      id: 14,
      name: "Cupom 99",
      description: "R$ 20 de desconto nas corridas",
      points_cost: 750,
      image_url: "assets/rewards/99.jpeg",
    },
    {
      id: 15,
      name: "Pontos LATAM Pass",
      description: "700 pontos para suas viagens",
      points_cost: 1200,
      image_url: "assets/rewards/latam.jpeg",
    },
    {
      id: 16,
      name: "Pontos TudoAzul",
      description: "700 pontos para voar mais",
      points_cost: 1100,
      image_url: "assets/rewards/tudo-azul.png",
    },
    {
      id: 17,
      name: "Cupom Udemy",
      description: "50% em cursos selecionados",
      points_cost: 800,
      image_url: "assets/rewards/udemy.png",
    },
    {
      id: 18,
      name: "Acesso Premium",
      description: "30 dias em plataforma de redação",
      points_cost: 900,
      image_url: "assets/rewards/curso-redacao.jpeg",
    },
  ];

  // ---------------- FUNÇÃO PARA CRIAR CARD ----------------
  function createRewardCard(reward, userPoints, isExtra = false) {
    const canRedeem = userPoints >= reward.points_cost;
    const extraClass = isExtra ? " extra-reward hidden" : "";

    return `
      <div class="reward-card${extraClass}">
        <div class="reward-img-wrapper">
          <img src="${reward.image_url}" alt="${reward.name}" />
        </div>
        <h3 class="reward-card-title">${reward.name}</h3>
        ${
          reward.description
            ? `<p class="reward-card-description">${reward.description}</p>`
            : ""
        }
        <span class="reward-card-cost">${reward.points_cost} JCoins</span>

        <button class="reward-button ${canRedeem ? "" : "disabled"}">
          ${canRedeem ? "Resgatar" : "Indisponível"}
        </button>
      </div>
    `;
  }

  // ---------------- BUSCAR RECOMPENSAS (API + FALLBACK) ----------------
  async function loadRewards() {
    try {
      const res = await fetch(`${API_BASE_URL}/rewards`);
      if (!res.ok) throw new Error("Erro HTTP");
      const data = await res.json();
      return data.rewards;
    } catch (err) {
      console.warn(
        "[/rewards] Backend indisponível, usando MOCK_REWARDS:",
        err
      );
      return MOCK_REWARDS;
    }
  }

  // ---------------- EXECUÇÃO INICIAL ----------------
  const userPoints = MOCK_USER_POINTS; // por enquanto mockado
  balanceValue.textContent = userPoints;

  const rewards = await loadRewards();

  // melhores recompensas = as 5 primeiras (igual layout antigo)
  const bestRewards = rewards.slice(0, 5);
  // todas as recompensas
  const allRewards = rewards;

  // preencher seção MELHORES RECOMPENSAS
  bestRewardsGrid.innerHTML = "";
  bestRewards.forEach((r) => {
    bestRewardsGrid.insertAdjacentHTML(
      "beforeend",
      createRewardCard(r, userPoints, false)
    );
  });

  // preencher seção TODAS AS RECOMPENSAS
  allRewardsGrid.innerHTML = "";
  const VISIBLE_COUNT = 10; // quantas aparecem antes do "Ver mais"

  allRewards.forEach((r, index) => {
    const isExtra = index >= VISIBLE_COUNT;
    allRewardsGrid.insertAdjacentHTML(
      "beforeend",
      createRewardCard(r, userPoints, isExtra)
    );
  });

  // ---------------- VER MAIS / VER MENOS ----------------
  if (toggleBtn) {
    let expanded = false;

    toggleBtn.addEventListener("click", () => {
      const extraRewards = document.querySelectorAll(".extra-reward");

      expanded = !expanded;

      extraRewards.forEach((card) => {
        card.classList.toggle("hidden", !expanded);
      });

      toggleBtn.textContent = expanded ? "Ver menos" : "Ver mais";
    });
  }
});
