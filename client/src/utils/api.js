const BASE_URL = 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ---------- EVENTS ----------
export const fetchEvents = async () => {
  const response = await fetch(`${BASE_URL}/api/events`, {
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

export const createEvent = async (eventData) => {
  const response = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

export const updateEvent = async (eventId, eventData) => {
  const response = await fetch(`${BASE_URL}/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

export const deleteEvent = async (eventId) => {
  const response = await fetch(`${BASE_URL}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

// ---------- AUTH ----------
export const register = async ({ username, email, password }) => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return await response.json();
};

export const login = async ({ email, password }) => {
  // frontend šalje payload
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }), // pošalji točno što backend očekuje
  });
console.log('Login attempt:', email, password);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data;
};



// Ako želiš axios helper za lakše API pozive
import axios from 'axios';
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
