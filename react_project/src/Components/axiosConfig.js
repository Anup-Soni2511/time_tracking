import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL, // Adjust based on your setup
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  config => {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      config.headers['Authorization'] = `Bearer ${access_token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
