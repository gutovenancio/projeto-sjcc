const User = require('../database/models/User');
const UserStreak = require('../database/models/UserStreak');

async function getRanking() {
  const userStreaks = await UserStreak.findAll({
    include: [{ model: User, attributes: ['id', 'username'] }]
  });

  const rankingData = userStreaks.map(s => ({
    userId: s.User.id,
    user: s.User.username,
    streak: s.current_streak || 0
  }));

  rankingData.sort((a, b) => b.streak - a.streak);
  rankingData.forEach((item, index) => (item.position = index + 1));

  return rankingData;
}

async function getUserRanking(userId) {
  const rankingData = await getRanking();
  const userData = rankingData.find(r => r.userId === parseInt(userId));
  const top10 = rankingData.slice(0, 10);

  if (!userData) throw new Error('Usuário não encontrado no ranking');

  return {
    position: userData.position,
    user: userData.user,
    streak: userData.streak,
    top10
  };
}

module.exports = { getRanking, getUserRanking };
