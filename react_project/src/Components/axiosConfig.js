import axios from 'axios';
import { store } from '../redux/store';
import { stopTimer } from '../redux/timerSlice.js';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL, // Adjust based on your setup
});

// Add a request interceptor
const isTokenExpired = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expirationTime = payload.exp * 1000;
  return Date.now() > expirationTime;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // If the access token is present and expired
    if (accessToken && isTokenExpired(accessToken)) {
      store.dispatch(stopTimer());
      try {
        // Attempt to refresh the token
        const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/api/user/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data.token;
        localStorage.setItem('access_token', access);
        config.headers['Authorization'] = `Bearer ${access}`;
      } catch (error) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject(error);
      }
    } else if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
