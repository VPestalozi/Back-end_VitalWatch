import express from 'express';
import cors from 'cors';
import medidasRoutes from './routes/medidas.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Libera o acesso para o Angular
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Rotas
app.use('/medidas', medidasRoutes);

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});