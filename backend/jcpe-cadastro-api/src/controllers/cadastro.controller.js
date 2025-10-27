// src/controllers/cadastro.controller.js
const usuarioService = require('../services/usuarioService');

module.exports = {
  async criarCadastro(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
      }

      const usuario = await usuarioService.criarUsuario({
        nome,
        email,
        senha
      });

      return res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        usuario: usuario.toJSON()
      });

    } catch (error) {
      console.error('Erro no controller:', error);
      
      if (error.message === 'Email já cadastrado.') {
        return res.status(409).json({ error: error.message });
      }

      if (error.message.includes('Email inválido') || 
          error.message.includes('Senha deve ter') ||
          error.message.includes('obrigatórios')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};