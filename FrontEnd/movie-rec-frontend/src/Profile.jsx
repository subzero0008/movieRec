import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRatings = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/MovieRatings/user/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch user ratings');
        }
        
        const data = await response.json();
        setRatings(data);
      } catch (err) {
        console.error('Error fetching user ratings:', err);
        setError('Failed to load your ratings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRatings();
  }, [user]);

  const handleDeleteRating = async (movieId) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този рейтинг?')) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/MovieRatings/${movieId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        
        if (response.ok) {
          setRatings(ratings.filter(rating => rating.movieId !== movieId));
        } else {
          throw new Error('Failed to delete rating');
        }
      } catch (err) {
        console.error('Error deleting rating:', err);
        setError('Failed to delete rating. Please try again.');
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg text-white text-center">
        <h2 className="text-2xl font-bold mb-6">Профил</h2>
        <p className="mb-4">Трябва да влезете в профила си, за да видите тази страница.</p>
        <Link 
          to="/login" 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block"
        >
          Вход
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-lg text-white">
      <h2 className="text-2xl font-bold mb-6">Профил</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Info Section */}
        <div className="md:col-span-1 bg-gray-700 p-4 rounded-lg">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Информация</h3>
              <p><span className="font-medium">Потребителско име:</span> {user.username}</p>
              <p><span className="font-medium">Имейл:</span> {user.email}</p>
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Изход
            </button>
          </div>
        </div>
        
        {/* Ratings Section */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Вашите рейтинги</h3>
          
          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <p>Зареждане на вашите рейтинги...</p>
          ) : ratings.length === 0 ? (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p>Все още нямате добавени рейтинги.</p>
              <Link 
                to="/" 
                className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                Прегледайте филми и добавете рейтинг
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map(rating => (
                <div key={`${rating.movieId}-${rating.ratedOn}`} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        to={`/movies/${rating.movieId}`}
                        className="font-medium hover:text-blue-400"
                      >
                        Филм ID: {rating.movieId}
                      </Link>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span>{rating.rating} звезди</span>
                      </div>
                      {rating.review && (
                        <p className="mt-2 text-gray-300">{rating.review}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(rating.ratedOn).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDeleteRating(rating.movieId)}
                        className="mt-2 text-sm bg-red-500/30 hover:bg-red-500/40 text-red-300 py-1 px-3 rounded"
                      >
                        Изтрий
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;