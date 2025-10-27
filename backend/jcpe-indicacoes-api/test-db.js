import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('🔍 Testando conexão com o banco...');

connection.connect((error) => {
    if (error) {
        console.error('❌ Erro na conexão:', error.message);
        return;
    }
    
    console.log('✅ Conectado ao MySQL!');
    
    connection.query('SHOW TABLES', (error, results) => {
        if (error) throw error;
        
        console.log('📊 Tabelas no banco:');
        results.forEach(row => {
            console.log('   -', row[`Tables_in_${process.env.DB_NAME}`]);
        });
        
        connection.query('SELECT COUNT(*) as total FROM indicacoes', (error, results) => {
            if (error) throw error;
            console.log(`📈 Total de indicações: ${results[0].total}`);
            
            connection.query('SELECT codigo_unico, data_expiracao, utilizado, expirado FROM indicacoes', (error, results) => {
                if (error) throw error;
                
                console.log('📋 Indicações:');
                results.forEach(ind => {
                    const status = ind.expirado ? 'EXPIRADO' : ind.utilizado ? 'UTILIZADO' : 'ATIVO';
                    console.log(`   - ${ind.codigo_unico} | Expira: ${ind.data_expiracao} | ${status}`);
                });
                
                connection.end();
            });
        });
    });
});