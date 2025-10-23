
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

module.exports = {
  async criarCadastro(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
      }

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        return res.status(409).json({ error: "Email já cadastrado." });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
        },
      });

      return res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          criadoEm: novoUsuario.criadoEm,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao cadastrar usuário." });
    }
  },
};
