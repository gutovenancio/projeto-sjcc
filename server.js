
require('dotenv').config();

const express = require('express');
const app = express();


app.use(express.json());


const pool = require('./db');


const { 
  recordShareEvent, 
  getTotalSharesByUser, 
  getTotalSharesByNews 
} = require('./sharesController');


function sendJson(res, status, obj) {
  return res.status(status).json(obj);
}


app.post('/shares', async (req, res) => {
  try {
    const { user_id, news_id } = req.body;

    if (!user_id || !news_id) {
      return sendJson(res, 400, { error: 'user_id e news_id são obrigatórios' });
    }

    const result = await recordShareEvent(user_id, news_id);

    if (result.success) {
      return sendJson(res, 201, { 
        message: 'Compartilhamento registrado com sucesso!', 
        share_id: result.insertId 
      });
    }

    return sendJson(res, 500, { error: result.error });

  } catch (err) {
    console.error('POST /shares error:', err);
    return sendJson(res, 500, { error: 'Erro interno do servidor' });
  }
});


app.get('/shares', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM user_shares ORDER BY shared_at DESC LIMIT 100'
    );
    return sendJson(res, 200, rows);

  } catch (err) {
    console.error('Erro ao buscar compartilhamentos:', err);
    return sendJson(res, 500, { error: 'Erro ao buscar compartilhamentos' });
  }
});


app.get('/shares/user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  const result = await getTotalSharesByUser(user_id);

  if (result.success) {
    return sendJson(res, 200, { user_id, total: result.total });
  }

  return sendJson(res, 500, { error: result.error });
});

// Total de compartilhamentos por notícia
app.get('/shares/news/:news_id', async (req, res) => {
  const { news_id } = req.params;

  const result = await getTotalSharesByNews(news_id);

  if (result.success) {
    return sendJson(res, 200, { news_id, total: result.total });
  }

  return sendJson(res, 500, { error: result.error });
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
