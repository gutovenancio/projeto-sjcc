// seed.js (MySQL)
const pool = require('./db');

(async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // limpa (ordem: filho -> pai)
    await conn.query('DELETE FROM redeem_history');
    await conn.query('DELETE FROM user_points');
    await conn.query('DELETE FROM rewards');

    // prêmios
    await conn.query(
      'INSERT INTO rewards (title, description, cost_points, stock, is_active) VALUES (?, ?, ?, ?, 1)',
      ['Camiseta SJCC', 'Tamanho P/M/G', 500, 10]
    );
    await conn.query(
      'INSERT INTO rewards (title, description, cost_points, stock, is_active) VALUES (?, ?, ?, ?, 1)',
      ['Caneca SJCC', 'Cerâmica 300ml', 300, 25]
    );
    await conn.query(
      'INSERT INTO rewards (title, description, cost_points, stock, is_active) VALUES (?, ?, ?, ?, 1)',
      ['Clube de Descontos (1 mês)', 'Assinatura mensal', 800, null] // null = estoque ilimitado
    );

    // usuário de teste
    await conn.query(
      'INSERT INTO user_points (user_id, balance) VALUES (?, ?)',
      ['1', 1200]
    );
    console.log("--- PROVA: Inserindo usuário '1' com 1200 JCoins ---");
    await conn.commit();
    console.log('Seed OK ✅ (MySQL)');
  } catch (e) {
    await conn.rollback();
    console.error('Seed falhou:', e);
  } finally {
    conn.release();
    process.exit(0);
  }
})();
