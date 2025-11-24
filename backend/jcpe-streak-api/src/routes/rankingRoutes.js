const express = require('express');
const router = express.Router();
const {getGeneralRanking, getUserRankingInfo} = require('../controllers/rankingController');

router.get('/ranking', getGeneralRanking);
router.get('/user/:id/ranking', getUserRankingInfo);

module.exports = router;
