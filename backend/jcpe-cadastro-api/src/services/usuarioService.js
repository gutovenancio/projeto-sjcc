const { PrismaClient } = require('@prisma/client');
const Usuario = require('../models/Usuario');

const prisma = new PrismaClient();

class UsuarioService {
  async criarUsuario(dadosUsuario) {
    try {
      // criar instância do domínio
      const usuario = await Usuario.criar(
        dadosUsuario.nome,
        dadosUsuario.email,
        dadosUsuario.senha
      );

      // verificar regra de negócio: email único
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: usuario.email },
      });

      if (usuarioExistente) {
        throw new Error('Email já cadastrado.');
      }

      // persistir no banco
      const usuarioSalvo = await prisma.usuario.create({
        data: {
          nome: usuario.nome,
          email: usuario.email,
          senha: usuario.senhaHash,
          criadoEm: usuario.criadoEm,
        },
      });

      // atualizar a instância do domínio com o ID gerado
      usuario.id = usuarioSalvo.id;

      return usuario;

    } catch (error) {
      throw error;
    }
  }

  async buscarPorEmail(email) {
    const usuarioDB = await prisma.usuario.findUnique({
        where: { email },
    });

    if (!usuarioDB) return null;

    return new Usuario(
        usuarioDB.id,
        usuarioDB.nome,
        usuarioDB.email,
        usuarioDB.senha,
        usuarioDB.criadoEM
    );

  }
  async buscarPorId(id) {
    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: id },
    });

    if (!usuarioDB) return null;

    // Re-usa o model de domínio
    return new Usuario(
        usuarioDB.id,
        usuarioDB.nome,
        usuarioDB.email,
        usuarioDB.senha, // (senhaHash)
        usuarioDB.criadoEm
    );
  }
}

module.exports = new UsuarioService();
