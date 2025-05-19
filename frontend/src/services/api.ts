import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust if your backend runs on a different port/host in production
  withCredentials: true, // Important for sending session cookies
});

export default apiClient;

