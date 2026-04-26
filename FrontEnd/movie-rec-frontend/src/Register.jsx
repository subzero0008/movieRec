import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { register } from './services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    registerAsCinema: false,
    cinemaName: '',
    city: '',
    phoneNumber: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
        confirmPassword: formData.confirmPassword,
        registerAsCinema: formData.registerAsCinema,
        cinemaName: formData.cinemaName,
        city: formData.city,
        phoneNumber: formData.phoneNumber
      });
      
      setMessage(`Регистрацията е успешна! ${formData.registerAsCinema ? 'Като киноцентър' : 'Като потребител'}`);
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
      <h2 className="text-2xl font-bold text-white mb-6">Register</h2>
      {message && <div className="mb-4 p-2 bg-green-500 text-white rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Основна форма */}
        <div>
          <label className="block text-white mb-2">Username</label>
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
          <label className="block text-white mb-2">Email:</label>
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
          <label className="block text-white mb-2">Password:</label>
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
          <label className="block text-white mb-2">Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        
        {/* Опция за регистрация като киноцентър */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="registerAsCinema"
            name="registerAsCinema"
            checked={formData.registerAsCinema}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="registerAsCinema" className="text-white">
            Register me as a Cinema Center
          </label>
        </div>
        
        {/* Допълнителни полета за киноцентрове */}
        {formData.registerAsCinema && (
          <>
            <div>
              <label className="block text-white mb-2">Cinema Name</label>
              <input
                type="text"
                name="cinemaName"
                value={formData.cinemaName}
                onChange={handleChange}
                required={formData.registerAsCinema}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">City:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required={formData.registerAsCinema}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Telephone:</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required={formData.registerAsCinema}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              />
            </div>
          </>
        )}
        
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
        Register me
        </button>
      </form>

      <div className="mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="text-gray-400 text-sm">or sign up with</span>
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
                  navigate('/login');
                  Swal.fire({ title: 'Success!', text: 'Account created with Google. Please log in.', icon: 'success', background: '#1F2937', color: '#fff', confirmButtonColor: '#EAB308' });
                } else {
                  Swal.fire({ title: 'Error', text: data.message || 'Google sign up failed', icon: 'error', background: '#1F2937', color: '#fff', confirmButtonColor: '#EAB308' });
                }
              } catch (err) {
                console.error(err);
              }
            }}
            onError={() => Swal.fire({ title: 'Error', text: 'Google sign up failed', icon: 'error', background: '#1F2937', color: '#fff', confirmButtonColor: '#EAB308' })}
            theme="filled_black"
            shape="pill"
            text="signup_with"
            locale="en"
          />
        </div>
      </div>

      <p className="mt-4 text-white">
       You already have account{' '}
        <a href="/login" className="text-blue-400 hover:underline">
          Log In
        </a>
      </p>
    </div>
  );
};

export default Register;