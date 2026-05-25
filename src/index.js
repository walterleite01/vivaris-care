require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { initializeDatabase } = require('./db');
const { runMigrations } = require('./db/migration-runner');
const authRoutes = require('./routes/auth');
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check (público)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    timestamp: new Date() 
  });
});

// Rotas de autenticação (público)
app.use('/api/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api/protected', authenticate);

// Rota protegida de teste
app.get('/api/protected/me', authenticate, (req, res) => {
  res.json({ message: `Bem-vindo, ${req.user.full_name}!`, user: req.user });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Inicializar banco e rodar migrations
async function start() {
  try {
    await initializeDatabase();
    await runMigrations(require('./db').query);
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 ${process.env.APP_NAME} rodando em http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar:', err.message);
    process.exit(1);
  }
}

start();

module.exports = { app, io };
