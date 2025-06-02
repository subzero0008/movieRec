import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PollMovieSelector from './PollMovieSelector';
import pollService from '../services/pollService';
import { useAuth } from '../AuthContext';

const CreatePollForm = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    endDate: '',
  });
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    console.log('Current selected movies:', selectedMovies);
  }, [selectedMovies]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    if (selectedMovies.length < 2) {
      newErrors.movies = 'At least 2 movies are required';
    }

    const startDate = new Date(); // Текуща дата
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      newErrors.endDate = 'End date must be after current date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const pollData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: new Date().toISOString(), // автоматично зададена текуща дата
        endDate: new Date(formData.endDate).toISOString(),
        movieIds: selectedMovies.map(movie => movie.id),
      };

      console.log('Submitting poll:', pollData);
      const response = await pollService.createPoll(pollData);
      console.log('Poll created:', response);

      setFormData({
        title: '',
        description: '',
        endDate: '',
      });
      setSelectedMovies([]);
      setErrors({});
      setApiError(null);

      navigate('/polls/active');
    } catch (error) {
      console.error('Create poll error:', error);
      if (error.response?.status === 401) {
        setApiError('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        setApiError(error.response?.data?.message || 'Failed to create poll');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center">Create New Poll</h2>

      {apiError && (
        <div className="mb-6 p-4 bg-red-800 text-white rounded-md">
          <p className="font-medium">{apiError}</p>
          {apiError.toLowerCase().includes('session') && (
            <button
              onClick={() => navigate('/login')}
              className="mt-2 px-4 py-2 bg-white text-red-800 font-bold rounded"
            >
              Login Now
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="title">
            Poll Title *
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              errors.title ? 'border-red-500' : 'border-gray-700'
            }`}
            placeholder="Enter poll title"
            autoComplete="off"
          />
          {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter poll description"
            rows="3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Премахнато поле за startDate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="endDate">
              End Date *
            </label>
            <input
              id="endDate"
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.endDate ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-4">Select Movies *</h3>
          <PollMovieSelector onMoviesSelected={setSelectedMovies} />
          {errors.movies && <p className="mt-2 text-sm text-red-400">{errors.movies}</p>}
          
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-md transition duration-300 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePollForm;
