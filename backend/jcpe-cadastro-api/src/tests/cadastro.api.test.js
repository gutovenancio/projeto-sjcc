const request = require('supertest'); 
const { PrismaClient } = require('@prisma/client');
const app = require('../server'); 

const prisma = new PrismaClient();

describe('API de Cadastro - /api/cadastro', () => {
  beforeEach(async () => {
    await prisma.usuario.deleteMany({
      where: {
        email: {
          in: ['teste@api.com', 'novo@usuario.com', 'duplicado@teste.com', 'email-invalido@teste.com', 'senha@curta.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/cadastro', () => {
    it('deve criar um novo usuário com dados válidos', async () => {
      const usuarioData = {
        nome: 'Usuário Teste API',
        email: 'teste@api.com',
        senha: 'senha123'
      };

      const response = await request(app)
        .post('/api/cadastro')
        .send(usuarioData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Usuário cadastrado com sucesso!');
      expect(response.body).toHaveProperty('usuario');
      expect(response.body.usuario).toHaveProperty('id');
      expect(response.body.usuario).toHaveProperty('nome', usuarioData.nome);
      expect(response.body.usuario).toHaveProperty('email', usuarioData.email);
      expect(response.body.usuario).toHaveProperty('criadoEm');
      expect(response.body.usuario).not.toHaveProperty('senha');
      expect(response.body.usuario).not.toHaveProperty('senhaHash');
    });

    it('deve retornar erro 400 quando faltam campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/cadastro')
        .send({
          nome: 'Apenas Nome'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar erro 409 para email duplicado', async () => {
      await request(app)
        .post('/api/cadastro')
        .send({
          nome: 'Primeiro Usuário',
          email: 'duplicado@teste.com',
          senha: 'senha123'
        })
        .expect(201);

      const response = await request(app)
        .post('/api/cadastro')
        .send({
          nome: 'Segundo Usuário',
          email: 'duplicado@teste.com',
          senha: 'outrasenha'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email já cadastrado.');
    });

    it('deve retornar erro 400 para email inválido', async () => {
      const response = await request(app)
        .post('/api/cadastro')
        .send({
          nome: 'Usuário Email Inválido',
          email: 'email-invalido',
          senha: 'senha123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email inválido.');
    });

    it('deve retornar erro 400 para senha muito curta', async () => {
      const response = await request(app)
        .post('/api/cadastro')
        .send({
          nome: 'Usuário Senha Curta',
          email: 'senha@curta.com',
          senha: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Senha deve ter pelo menos 6 caracteres.');
    });
  });

  describe('GET /api/cadastro', () => {
    it('deve retornar 404 ou método não permitido para GET', async () => {
      await request(app)
        .get('/api/cadastro')
        .expect(404);
    });
  });
});