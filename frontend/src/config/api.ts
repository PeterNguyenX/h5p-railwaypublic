import axios from 'axios';
import { runtimeConfig } from './runtime';

const API_BASE_URL = runtimeConfig.apiUrl;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const GLOBAL_API_ERROR_EVENT = 'global-api-error';

const emitGlobalApiError = (status: number, message: string) => {
  window.dispatchEvent(
    new CustomEvent(GLOBAL_API_ERROR_EVENT, {
      detail: { status, message },
    })
  );
};

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message || error?.response?.data?.error;

    if (status === 401) {
      emitGlobalApiError(401, serverMessage || 'Your session expired. Please sign in again.');
      localStorage.removeItem('token');
      setTimeout(() => {
        window.location.href = '/login';
      }, 800);
    } else if (status === 403) {
      emitGlobalApiError(403, serverMessage || 'You do not have permission to perform this action.');
    } else if (status === 404) {
      emitGlobalApiError(404, serverMessage || 'The requested resource was not found.');
    }

    return Promise.reject(error);
  }
);

export default api;
export { GLOBAL_API_ERROR_EVENT };