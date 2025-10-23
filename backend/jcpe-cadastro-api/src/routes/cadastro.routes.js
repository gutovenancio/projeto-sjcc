const express = require("express");
const router = express.Router();
const cadastroController = require('../controllers/cadastro.controller');

router.post('/cadastros', cadastroController.criarCadastro);

module.exports = router;