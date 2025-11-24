const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function initializePointsTables() {
    try {
        console.log('🔄 Inicializando tabelas do sistema de pontuação...');

        const sqlPath = path.join(__dirname, 'points_init.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool.execute(statement);
                    console.log(`✅ Executado: ${statement.substring(0, 50)}...`);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn('Aviso:', error.message);
                    }
                }
            }
        }

        console.log('✅ Sistema de pontuação inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema de pontuação:', error);
        throw error;
    }
}

if (require.main === module) {
    initializePointsTables()
        .then(() => {
            console.log('✅ Sistema de Pontuação - Tabelas criadas!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro:', error);
            process.exit(1);
        });
}

module.exports = { initializePointsTables };