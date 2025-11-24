const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Maluzinha1402@',
    database: process.env.DB_NAME || 'news_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_reads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                news_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_read_at (user_id, read_at)
            )
        `);
        
        connection.release();
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    }
}

module.exports = { pool, initializeDatabase };