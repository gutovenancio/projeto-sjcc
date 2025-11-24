const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/points', require('./routes/points'));


app.get('/points/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sistema de Pontuação funcionando',
        module: 'points-system',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🎯 Sistema de Pontuação rodando na porta ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/points/health`);
});

module.exports = app;