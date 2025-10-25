const request = require('supertest');
const app = require('../server'); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.usuario.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Testes de Cadastro de Usuário', () => {
  it('Deve cadastrar um novo usuário com sucesso', async () => {
    const novoUsuario = {
      nome: 'Caio',
      email: 'caio@example.com',
      senha: '12345678'
    };

    const response = await request(app)
      .post('/api/cadastro')
      .send(novoUsuario)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.usuario).toHaveProperty('id');
    expect(response.body.usuario.nome).toBe('Caio');
    expect(response.body.usuario.email).toBe('caio@example.com');
  });

  it('Deve retornar erro se faltar campos obrigatórios', async () => {
    const usuarioInvalido = { nome: 'Caio' }; 

    const response = await request(app)
      .post('/api/cadastro')
      .send(usuarioInvalido)
      .expect(400);

    expect(response.body.error).toBe('Nome, email e senha são obrigatórios.');
  });
});
