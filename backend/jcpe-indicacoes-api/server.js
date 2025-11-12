import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database.js';
import indicacoesRoutes from './routes/indicacoes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', indicacoesRoutes);

app.get('/health', async (_, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as status');
        res.json({ 
            status: 'API funcionando', 
            database: 'Conectado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/', (_, res) => {
    res.json({
        message: '🚀 API JC Indicações - Online',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            gerar_convite: 'POST /api/invite/generate',
            validar_indicacao: 'GET /api/invite/validate/:codigo',
            utilizar_indicacao: 'POST /api/invite/use/:codigo',
            listar_indicacoes: 'GET /api/users/:id/invites'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API JC rodando na porta ${PORT}`);
});