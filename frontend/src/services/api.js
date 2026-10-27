import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/ai_timetable_generator/api',
});

// Interceptor to attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('timetable_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
