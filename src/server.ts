import express from 'express';
import cors from 'cors';
import { getDashboardData } from './controllers/MedidasController.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Libera o acesso para o Angular
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Rotas
// Exemplo de chamada: http://localhost:3000/dashboard?userId=UUID_AQUI&periodo=hoje
app.get('/dashboard', getDashboardData);

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor PWA rodando em http://localhost:${PORT}`);
});