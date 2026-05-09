import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || 'https://learn.evolvesight.com';
const API_BASE_URL = `${BASE_URL}/api`;

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default http;
