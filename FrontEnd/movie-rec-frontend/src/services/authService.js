import axios from 'axios';

// Променете baseURL да не включва "/account" в края
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавете request interceptor за error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    throw error;
  }
);

export const register = async (userData) => {
  try {
    const response = await api.post('/account/register', { // Забележете малката буква "a"
      Username: userData.username,
      Email: userData.email,
      Password: userData.password,
      ConfirmPassword: userData.confirmPassword
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data);
    throw error.response?.data || { message: 'Registration failed' };
  }
};

export const login = async (identifier, password) => {
  try {
    const response = await api.post('/Account/login', { // С главно "A" както е в Swagger
      Identifier: identifier,
      Password: password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    throw error.response?.data || { message: 'Login failed. Please try again.' };
  }
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};