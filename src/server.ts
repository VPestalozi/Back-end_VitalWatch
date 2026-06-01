import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from './middlewares/authMiddleware.js';
import medidasRoutes from './routes/medidas.js';
import authRoutes from './routes/auth.js';
import infoPacienteRoutes from './routes/infoPaciente.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Criando o servidor HTTP e vinculando o Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Ajuste conforme a URL do front-end em produção
  },
});

// Middleware de autenticação do Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Autenticação necessária (token não fornecido)'));
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: string; role: string };
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Token inválido'));
  }
});

// Tratando conexões
io.on('connection', (socket) => {
  const user = socket.data.user;
  
  if (user?.role === 'enfermeira') {
    const roomName = `enfermeira_${user.id}`;
    socket.join(roomName);
    console.log(`Enfermeira(o) ${user.id} conectada(o) à sala ${roomName}`);
  } else if (user?.role === 'paciente') {
    const roomName = `paciente_${user.id}`;
    socket.join(roomName);
    console.log(`Paciente ${user.id} conectado à sala ${roomName}`);
  }

  socket.on('disconnect', () => {
    // console.log(`Usuário ${user?.id} desconectado do socket.`);
  });
});

// Salva a instância do io no app para ser acessada nos controllers
app.set('io', io);

// Middlewares
app.use(cors()); // Libera o acesso para o front-end
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Rotas
app.use('/medidas', medidasRoutes);
app.use('/auth', authRoutes);
app.use('/infoPaciente', infoPacienteRoutes);

// Inicialização
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});