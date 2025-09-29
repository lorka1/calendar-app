require('dotenv').config();
const express = require('express');
const http = require('http'); // DODAJ OVO
const { Server } = require('socket.io'); // DODAJ OVO
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const connectDB = require('./config/db'); 
const holidaysRoute = require('./routes/holidays');
const cors = require('cors');
const path = require('path');

// Kreiraj app
const app = express();

// DODAJ: Kreiraj HTTP server
const server = http.createServer(app);

// DODAJ: Inicijaliziraj Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/holidays', holidaysRoute);

// DODAJ: Socket.io eventi
io.on('connection', (socket) => {
  console.log('Korisnik spojen:', socket.id);

  // Kada netko doda event
  socket.on('event-added', (eventData) => {
    console.log('Novi event dodan:', eventData);
    socket.broadcast.emit('calendar-updated', eventData);
  });

  // Kada netko updatea event
  socket.on('event-updated', (eventData) => {
    console.log('Event ažuriran:', eventData);
    socket.broadcast.emit('calendar-updated', eventData);
  });

  // Kada netko obriše event
  socket.on('event-deleted', (eventId) => {
    console.log('Event obrisan:', eventId);
    socket.broadcast.emit('event-removed', eventId);
  });

  socket.on('disconnect', () => {
    console.log('Korisnik odspojen:', socket.id);
  });
});

// VAŽNO: Promijeni app.listen u server.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});