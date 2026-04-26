import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from './services/authService';
import Swal from 'sweetalert2';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier.trim() || !formData.password) {
      setError('Моля попълнете всички полета');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiLogin(formData.identifier, formData.password);
      console.log('Login response:', response);

      if (!response || !response.token) {
        throw new Error('Невалиден отговор от сървъра');
      }

      // Подготвяме данните за authLogin
      const loginData = {
        token: response.token,
        user: response.user || null // Ако user данни се връщат отделно
      };

      authLogin(loginData);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Грешка при влизане. Моля опитайте отново.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Log In</h2>
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Email or Username</label>
          <input
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <div>
          <label className="block text-white mb-2">Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 px-4 rounded`}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="text-gray-400 text-sm">or continue with</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://movierec-backend-7jqo.onrender.com/api';
                const response = await fetch(`${API_URL}/account/google-login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: credentialResponse.credential })
                });
                const data = await response.json();
                if (response.ok) {
                  authLogin(data);
                  navigate('/');
                } else {
                  Swal.fire({ title: 'Error', text: data.message || 'Google login failed', icon: 'error', background: '#1F2937', color: '#fff', confirmButtonColor: '#EAB308' });
                }
              } catch (err) {
                console.error(err);
              }
            }}
            onError={() => Swal.fire({ title: 'Error', text: 'Google login failed', icon: 'error', background: '#1F2937', color: '#fff', confirmButtonColor: '#EAB308' })}
            theme="filled_black"
            shape="pill"
            text="signin_with"
          />
        </div>
      </div>

      <p className="mt-3 text-center">
        <button
          type="button"
          onClick={() => Swal.fire({
            title: 'Forgot Password?',
            html: 'To reset your password, please contact the system administrator at <strong>zerosub@gmail.com</strong>',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#EAB308',
            background: '#1F2937',
            color: '#FFFFFF',
          })}
          className="text-yellow-400 hover:text-yellow-300 text-sm underline bg-transparent border-none cursor-pointer"
        >
          Forgot your password?
        </button>
      </p>
      <p className="mt-4 text-white">
        Don't have acount yet?{' '}
        <a href="/register" className="text-blue-400 hover:underline">
   Register
        </a>
      </p>
    </div>
  );
};

export default Login;