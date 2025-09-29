import { io } from 'socket.io-client';

// Backend URL - promijeni ako je drugačiji
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Optional: Log za debug
socket.on('connect', () => {
  console.log('Socket spojen:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket odspojen');
});

socket.on('connect_error', (error) => {
  console.error('Socket greška:', error);
});