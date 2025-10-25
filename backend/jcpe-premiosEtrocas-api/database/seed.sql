-- seed.sql
USE sjcc_api;

-- Recompensas iniciais
INSERT INTO rewards (title, description, cost_points, stock, is_active) VALUES
('Camiseta SJCC', 'Tamanho P/M/G', 500, 10, 1),
('Caneca SJCC', 'Cerâmica 300ml', 300, 25, 1),
('Clube de Descontos (1 mês)', 'Assinatura mensal', 800, NULL, 1);

-- Usuário de teste
INSERT INTO user_points (user_id, balance) VALUES
('user-123', 1200);
