import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { login } from './services/authService';

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
      const response = await login(formData.identifier, formData.password);
      authLogin({
        username: formData.identifier,
        email: formData.identifier.includes('@') ? formData.identifier : null,
        token: response.token || null
      });
      navigate('/');
    } catch (err) {
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
      <h2 className="text-2xl font-bold text-white mb-6">Вход</h2>
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Имейл или потребителско име:</label>
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
          <label className="block text-white mb-2">Парола:</label>
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
          {isLoading ? 'Влизане...' : 'Влез'}
        </button>
      </form>
      <p className="mt-4 text-white">
        Нямате акаунт?{' '}
        <a href="/register" className="text-blue-400 hover:underline">
          Регистрирайте се
        </a>
      </p>
    </div>
  );
};

export default Login;