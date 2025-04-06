import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';
import Register from './Register';
import Login from './Login';
import { useAuth } from './AuthContext'; // Контекст за автентикация
import { AuthProvider } from './AuthContext'; // Импортиране на AuthProvider
import Profile from './Profile'; // Импортирайте компонента Profile

function App() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth() || {}; // Добавен logout
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api';

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/movies/trending`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setTrendingMovies(data.results || []);
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setError('Failed to load trending movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch(`${API_URL}/movies/search?query=${searchQuery}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('Failed to search movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div className="text-white text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  const moviesToDisplay = isSearching ? searchResults : trendingMovies;

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1 className="text-4xl font-bold text-white text-center mb-12">
                {isSearching ? 'Search Results' : 'Trending Movies'}
              </h1>

              <div className="flex justify-between mb-8">
                <div>
                  {!user ? (
                    <>
                      <a href="/login" className="px-4 py-2 mr-4 bg-blue-500 text-white rounded-md">Login</a>
                      <a href="/register" className="px-4 py-2 bg-green-500 text-white rounded-md">Register</a>
                    </>
                  ) : (
                    <>
                      <span className="text-white mr-4">Welcome, {user.username}</span>
                      <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md">Logout</button>
                    </>
                  )}
                </div>

                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 rounded-md text-black"
                  />
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {moviesToDisplay.length > 0 ? (
                  moviesToDisplay.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={{
                        id: movie.id,
                        title: movie.title,
                        posterUrl: movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}`,
                        releaseDate: movie.releaseDate,
                        voteAverage: movie.voteAverage,
                      }}
                    />
                  ))
                ) : (
                  <div className="text-white text-center mt-8">Няма намерени филми</div>
                )}
              </div>
            </>
          }
        />

        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
