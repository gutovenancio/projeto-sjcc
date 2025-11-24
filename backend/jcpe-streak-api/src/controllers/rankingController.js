const {getRanking, getUserRanking} = require('../services/rankingService');

async function getGeneralRanking(req, res) {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar ranking", error: error.message });
  }
}

async function getUserRankingInfo(req, res) {
  try {
    const { id } = req.params;
    const data = await getUserRanking(id);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar ranking do usuário", error: error.message });
  }
}

module.exports = { getGeneralRanking, getUserRankingInfo };
