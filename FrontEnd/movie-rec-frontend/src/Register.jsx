import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from './services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Паролите не съвпадат');
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      setMessage('Регистрацията е успешна! Можете да влезете в системата.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Неуспешна регистрация');
      if (err.errors) {
        const errorMessages = Object.values(err.errors).join(', ');
        setError(errorMessages);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Регистрация</h2>
      {message && <div className="mb-4 p-2 bg-green-500 text-white rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Потребителско име:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <div>
          <label className="block text-white mb-2">Имейл:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
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
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <div>
          <label className="block text-white mb-2">Потвърди парола:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Регистрирай се
        </button>
      </form>
      <p className="mt-4 text-white">
        Вече имате акаунт?{' '}
        <a href="/login" className="text-blue-400 hover:underline">
          Влезте
        </a>
      </p>
    </div>
  );
};  // <- Затваряща скоба на компонента

export default Register;  // <- Експорт на нов ред