import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import MovieCard from '../MovieCard';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '../services/recommendationService';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Current user:', user); // Debug log
    
    const fetchData = async () => {
      try {
        console.log('Fetching recommendations...');
        setLoading(true);
        const data = await getRecommendations(10);
        console.log('Received data:', data); // Debug log
        setRecommendations(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        
        if (error.response?.status === 401) {
          console.log('Unauthorized, logging out...');
          logout();
          navigate('/login');
        } else {
          setError(error.message || 'Failed to load recommendations');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) { // Проверка за наличието на токен
      fetchData();
    } else {
      console.log('No user token available');
      setLoading(false);
    }
  }, [user, navigate, logout]);

  if (!user) {
    return (
      <div className="recommendations-container p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Personalized Recommendations</h2>
        <p className="text-lg mb-6">Please log in to get personalized movie recommendations.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-container p-6">
        <h2 className="text-2xl font-bold mb-6">Personalized Recommendations</h2>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
        {error.includes('rate at least 10 movies') && (
          <div className="mt-6 text-center">
            <p className="mb-6 text-lg">To get personalized recommendations, please rate at least 10 movies.</p>
            <button 
              onClick={() => navigate('/movies')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Browse Movies
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="recommendations-container p-6">
      <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
      
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendations.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              showRelevanceScore={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg mb-6">No recommendations found. Try rating more movies.</p>
          <button
            onClick={() => navigate('/movies')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Movies
          </button>
        </div>
      )}
    </div>
  );
};

export default Recommendations;