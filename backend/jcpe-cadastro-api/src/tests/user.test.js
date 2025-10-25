const Usuario = require('../models/Usuario');

describe('Modelo Usuario', () => {
  describe('Criação de usuário', () => {
    it('deve criar uma instância de usuário com dados válidos', async () => {
      const usuario = await Usuario.criar('João Silva', 'joao@email.com', 'senha123');
      
      expect(usuario.nome).toBe('João Silva');
      expect(usuario.email).toBe('joao@email.com');
      expect(usuario.senhaHash).toBeDefined();
      expect(usuario.id).toBeNull(); // Ainda não tem ID
      expect(usuario.criadoEm).toBeInstanceOf(Date);
    });

    it('deve lançar erro quando email é inválido', async () => {
      await expect(Usuario.criar('João', 'email-invalido', 'senha123'))
        .rejects
        .toThrow('Email inválido.');
    });

    it('deve lançar erro quando senha é muito curta', async () => {
      await expect(Usuario.criar('João', 'joao@email.com', '123'))
        .rejects
        .toThrow('Senha deve ter pelo menos 6 caracteres.');
    });

    it('deve verificar senha corretamente', async () => {
      const usuario = await Usuario.criar('Maria', 'maria@email.com', 'minhasenha');
      const senhaCorreta = await usuario.verificarSenha('minhasenha');
      const senhaIncorreta = await usuario.verificarSenha('senhaerrada');
      
      expect(senhaCorreta).toBe(true);
      expect(senhaIncorreta).toBe(false);
    });
  });

  describe('Alteração de dados', () => {
    it('deve alterar o nome corretamente', async () => {
      const usuario = await Usuario.criar('Pedro', 'pedro@email.com', 'senha123');
      usuario.alterarNome('Pedro Santos');
      
      expect(usuario.nome).toBe('Pedro Santos');
    });

    it('deve lançar erro ao tentar alterar para nome vazio', () => {
      const usuario = new Usuario(1, 'caio', 'caio@email.com', 'hash', new Date());
      
      expect(() => usuario.alterarNome(''))
        .toThrow('Nome não pode ser vazio.');
    });
  });
});