import axios from 'axios';
import { refresh, logout } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // 401이면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const success = await refresh();

      if (!success) {
        logout();
        return Promise.reject(error);
      }

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;