require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
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
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

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

app.get('/api/me', authenticate, (req, res) => {
  res.json({ message: `Bem-vindo, ${req.user.full_name}!`, user: req.user });
});

io.on('connection', (socket) => {
  console.log(`✅ Socket conectado: ${socket.id}`);
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
