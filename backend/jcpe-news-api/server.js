const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


app.use('/user', userRoutes);


app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API de Notícias funcionando',
        timestamp: new Date().toISOString()
    });
});


app.get('/', (req, res) => {
    res.json({
        name: 'News API - Sistema de Leituras',
        version: '1.0.0',
        endpoints: {
            'GET /user/:id/recent-reads': 'Obtém leituras recentes do usuário',
            'POST /user/:id/read': 'Registra uma leitura (para testes)',
            'GET /health': 'Status da API'
        },
        parameters: {
            'days': 'Parâmetro opcional para definir o período em dias (padrão: 7)'
        }
    });
});


async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📚 API de Leituras disponível em: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();