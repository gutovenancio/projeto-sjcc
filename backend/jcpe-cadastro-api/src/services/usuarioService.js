const { PrismaClient } = require('@prisma/client');
const Usuario = require('../models/Usuario');

const prisma = new PrismaClient();

class UsuarioService {
  async criarUsuario(dadosUsuario) {
    try {
      const usuario = await Usuario.criar(
        dadosUsuario.nome,
        dadosUsuario.email,
        dadosUsuario.senha
      );

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: usuario.email },
      });

      if (usuarioExistente) {
        throw new Error('Email já cadastrado.');
      }

      
      const usuarioSalvo = await prisma.usuario.create({
        data: {
          nome: usuario.nome,
          email: usuario.email,
          senha: usuario.senhaHash,
          criadoEm: usuario.criadoEm,
        },
      });

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
}

module.exports = new UsuarioService();
