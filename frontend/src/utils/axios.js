/**
 * Axios instance with default configuration
 */
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.ALERTS.replace('/api/v1/alerts/', ''),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Connection failed: Backend server is not running or not accessible');
      error.message = 'Cannot connect to backend server. Please ensure the backend is running on http://127.0.0.1:8001';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
