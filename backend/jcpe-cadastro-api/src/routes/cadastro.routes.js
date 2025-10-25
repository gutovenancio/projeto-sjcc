const express = require("express");
const router = express.Router();
const cadastroController = require('../controllers/cadastro.controller');

router.post('/cadastro', cadastroController.criarCadastro);

module.exports = router;