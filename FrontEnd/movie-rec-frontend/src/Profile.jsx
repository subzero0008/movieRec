import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';


const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // States for edit modes
  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  // Fields to store updated values
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetchUserRatings = async () => {
      if (!user) return;
  
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/user/${user.id}?page=1&pageSize=10`, 
          {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Accept': 'application/json'
            }
          }
        );
  
        if (!response.ok) {
          throw new Error('Failed to fetch user ratings');
        }
  
        const data = await response.json();
  
        if (data && data.ratings.length > 0) {
          setRatings(data.ratings);
        } else {
          setError('No ratings found for this user.');
        }
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

  const handleSaveUsernameChange = async () => {
    try {
      const response = await fetch('https://localhost:7115/api/Account/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CurrentPassword: currentPassword,
          NewUsername: username,
          NewPassword: '',
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update username');
      }
  
      const data = await response.json();
      setMessage(data.message);
      user.username = username;
      setCurrentPassword('');
      setEditUsername(false);
    } catch (err) {
      console.error('Error updating username:', err);
      setError(err.message);
    }
  };
  
  const handleSavePasswordChange = async () => {
    try {
      const response = await fetch('https://localhost:7115/api/Account/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CurrentPassword: currentPassword,
          NewUsername: '',
          NewPassword: newPassword,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update password');
      }
  
      const data = await response.json();
      setMessage(data.message);
      setCurrentPassword('');
      setNewPassword('');
      setEditPassword(false);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-6 text-blue-400">Профил</h2>
        <p className="mb-6 text-gray-300">Трябва да влезете в профила си, за да видите тази страница.</p>
        <Link 
          to="/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 inline-block"
        >
          Вход
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <h2 className="text-3xl font-bold text-white">Профил</h2>
          <p className="text-blue-100">Добре дошли, {user.username}!</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* User Info Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-700 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold mb-4 text-blue-400 border-b border-gray-600 pb-2">Информация</h3>
              
              <div className="space-y-6">
                {/* Username Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-300">Потребителско име:</span>
                    <span className="font-semibold">{user.username}</span>
                  </div>
                  
                  {editUsername ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Ново потребителско име</label>
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full p-3 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Текуща парола</label>
                        <input 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-3 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={handleSaveUsernameChange}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                          Запази
                        </button>
                        <button
                          onClick={() => setEditUsername(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                          Отказ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditUsername(true)}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 mt-2"
                    >
                      Редактирай име
                    </button>
                  )}
                </div>

                {/* Password Section */}
                <div>
                  {editPassword ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Нова парола</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Текуща парола</label>
                        <input 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-3 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={handleSavePasswordChange}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                          Запази
                        </button>
                        <button
                          onClick={() => setEditPassword(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                          Отказ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditPassword(true)}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                      Смяна на парола
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Изход
                </button>
              </div>
            </div>
          </div>
          
          {/* Ratings Section */}
          <div className="lg:col-span-3">
            <div className="bg-gray-700 rounded-lg p-6 shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-blue-400">Вашите рейтинги</h3>
                <Link 
                  to="/" 
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg transition duration-200"
                >
                  Добави нов рейтинг
                </Link>
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6">
                  {message}
                </div>
              )}
              
              {loading ? (
  <div className="flex justify-center items-center h-40">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
) : Array.isArray(ratings) && ratings.length === 0 ? (
  <div className="bg-gray-600/30 p-8 rounded-lg text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-lg text-gray-400 mb-4">Все още нямате добавени рейтинги.</p>
    <Link 
      to="/" 
      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
    >
      Прегледайте филми
    </Link>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Array.isArray(ratings) && ratings.map(rating => (
      <div 
        key={`${rating.movieId}`} 
        className="bg-gray-600/30 hover:bg-gray-600/50 rounded-lg p-5 transition duration-200 border border-gray-600/30 cursor-pointer"
        onClick={() => handleMovieClick(rating.movieId)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-bold text-white mb-1 hover:underline">{rating.movieTitle}</h4>
            <div className="flex items-center mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${i < rating.rating ? 'text-yellow-400' : 'text-gray-500'}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-300">{rating.rating}/5</span>
            </div>
            {rating.movieGenres && rating.movieGenres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {rating.movieGenres.map(genre => (
                  <span key={genre} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRating(rating.movieId);
            }} 
            className="text-red-400 hover:text-red-300 p-1 transition duration-200"
            title="Изтрий рейтинг"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {rating.review && (
          <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300 italic">"{rating.review}"</p>
          </div>
        )}
      </div>
    ))}
  </div>
)}
</div>
</div>
</div>
</div>
</div>  
);
};

export default Profile;