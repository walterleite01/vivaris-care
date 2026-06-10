require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { initializeDatabase } = require('./db');
const { runMigrations } = require('./db/migration-runner');
const authRoutes = require('./routes/auth');
const residentsRoutes = require('./routes/residents');
const medicationsRoutes = require('./routes/medications');
const scalesRoutes = require('./routes/scales');
const activitiesRoutes = require('./routes/activities');
const messagesRoutes = require('./routes/messages');
const timelineRoutes = require('./routes/timeline');
const momentsRoutes = require('./routes/moments');
const familyRequestsRoutes = require('./routes/family-requests');
const contractsRoutes = require('./routes/contracts');
const uploadRoutes = require('./routes/upload');
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Disponibiliza o io para os controllers via req.app.get('io')
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: process.env.APP_NAME, version: process.env.APP_VERSION, timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/scales', scalesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/family-requests', familyRequestsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/me', authenticate, (req, res) => {
  res.json({ message: `Bem-vindo, ${req.user.full_name}!`, user: req.user });
});

// ============================================
// SOCKET.IO - TEMPO REAL (com autenticação JWT)
// ============================================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token não fornecido'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket conectado: ${socket.id} (${socket.user?.full_name || 'anônimo'})`);

  // Sala pessoal do usuário (notificações diretas)
  if (socket.user?.id) {
    socket.join(`user:${socket.user.id}`);
  }

  // Entrar na sala de um residente (timeline, momentos, chat)
  socket.on('subscribe_resident', ({ resident_id }) => {
    if (!resident_id) return;
    socket.join(`resident:${resident_id}`);
    console.log(`📡 ${socket.user?.full_name} entrou na sala resident:${resident_id}`);
  });

  // Compatibilidade com o nome antigo usado no familiar-dashboard
  socket.on('subscribe_timeline', ({ resident_id }) => {
    if (!resident_id) return;
    socket.join(`resident:${resident_id}`);
  });

  socket.on('unsubscribe_resident', ({ resident_id }) => {
    if (resident_id) socket.leave(`resident:${resident_id}`);
  });

  // Indicador "digitando..." no chat
  socket.on('typing', ({ resident_id }) => {
    if (resident_id) {
      socket.to(`resident:${resident_id}`).emit('typing', {
        resident_id,
        user_name: socket.user?.full_name
      });
    }
  });

  socket.on('disconnect', () => console.log(`❌ Socket desconectado: ${socket.id}`));
});

async function start() {
  try {
    await initializeDatabase();
    await runMigrations(require('./db').query);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 ${process.env.APP_NAME} rodando em http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
    });
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

start();
module.exports = { app, io };
