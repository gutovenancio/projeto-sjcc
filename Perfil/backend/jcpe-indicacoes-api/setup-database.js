import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

console.log('🚀 Configurando banco de dados...');

const sqlScript = `
CREATE DATABASE IF NOT EXISTS sistema_indicacoes;

USE sistema_indicacoes;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS indicacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo_unico VARCHAR(50) UNIQUE NOT NULL,
    id_usuario_indicador INT NOT NULL,
    descricao VARCHAR(500) NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NULL,
    data_utilizacao TIMESTAMP NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    expirado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario_indicador) REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT IGNORE INTO usuarios (id, nome, email) VALUES 
(1, 'Usuário Teste JC', 'teste@jc.com');

INSERT IGNORE INTO indicacoes (codigo_unico, id_usuario_indicador, data_expiracao, descricao) VALUES 
('convite-teste-123', 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 'Convite de Teste JC');
`;

connection.query(sqlScript, (error) => {
    if (error) {
        console.error('❌ Erro ao configurar banco:', error.message);
        process.exit(1);
    }
    
    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📊 Estrutura criada:');
    console.log('   - Banco: sistema_indicacoes');
    console.log('   - Tabela: usuarios');
    console.log('   - Tabela: indicacoes');
    console.log('   - Dados de exemplo inseridos');
    
    connection.end();
});