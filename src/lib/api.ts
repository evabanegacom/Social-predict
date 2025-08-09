// src/lib/api-client.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
// const token = localStorage.getItem('user'); ? JSON.parse(localStorage.getItem('user')).token : null;
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — Attach token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor — Handle expired token or global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized. Redirecting to login or handle token refresh.');
      // Optional: clear token, redirect, notify, etc.
    //   localStorage.removeItem('token');
    //   window.location.href = '/login'; // optional
    }
    return Promise.reject(error);
  }
);

export default apiClient;
