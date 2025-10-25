-- schema.sql
CREATE DATABASE IF NOT EXISTS sjcc_api;
USE sjcc_api;

-- Tabela de recompensas
CREATE TABLE rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cost_points INT NOT NULL,
    stock INT,
    is_active TINYINT(1) DEFAULT 1
);

-- Tabela de pontos do usuário
CREATE TABLE user_points (
    user_id VARCHAR(50) PRIMARY KEY,
    balance INT DEFAULT 0
);

-- Histórico de resgates
CREATE TABLE redeem_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    reward_id INT,
    quantity INT,
    points_spent INT,
    balance_before INT,
    balance_after INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
);
