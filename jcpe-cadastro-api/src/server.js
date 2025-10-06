const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const router = express.Router();

const cadastroRoutes = require('./routes/cadastro.routes.js');

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

//rotas
app.use('/api', cadastroRoutes);

app.get("/", (req, res) => {
    res.json({ message: "API rodando com sucesso."});
});


// inicio servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>  {
    console.log(`Servidor rodando na porta ${PORT}`);
});