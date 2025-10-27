import axios from 'axios';

// Allow overriding the backend URL at build time via Vite env var VITE_API_URL.
// Fallback to the known Render URL when env var is not provided.
const prodBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : 'https://smart-grocer-backend-1.onrender.com/api';

const api = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD)
    ? prodBase
    : '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
