import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';
import Register from './Register';
import Login from './Login';
import { useAuth } from './AuthContext';
import Profile from './Profile';
import WatchedMoviesList from './components/WatchedMoviesList';
import Navbar from './components/Navbar';
import SearchResults from './components/SearchResults';
import Recommendations from './components/Recommendations';
import TvShowsList from './components/TvShowsList';
import TvShowDetails from './components/TvShowDetails';
import Survey from './components/Survey';
import SurveyResults from './components/SurveyResults';
import MoviesList from './components/MoviesList';
import { MoviesService } from './services/MoviesService';




function App() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth() || {};
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
      const results = await MoviesService.searchMovies(searchQuery);
      setSearchResults(results.movies);
      // Пренасочване към search страницата с резултатите
      navigate('/search-results', { 
        state: { 
          movies: results.movies, 
          query: searchQuery 
        } 
      });
    } catch (error) {
      console.error('Error searching movies:', error);
      setError(error.message || 'Failed to search movies');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logout();
  };

  const moviesToDisplay = isSearching ? searchResults : trendingMovies;

  if (loading) {
    return <div className="text-white text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1 className="text-4xl font-bold text-white text-center mb-12">
                {isSearching ? 'Search Results' : 'Trending Movies'}
              </h1>
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
        <Route path="/watched" element={user ? <WatchedMoviesList /> : <Navigate to="/login" />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/recommendations" element={user ? <Recommendations /> : <Navigate to="/login" />} />
        <Route path="/movies" element={<MoviesList />} />

        
        {/* Добавени маршрути за TV shows */}
        <Route path="/tv" element={<TvShowsList />} />
        <Route path="/tv/:id" element={<TvShowDetails />} />
        <Route 
  path="/survey" 
  element={user ? <Survey /> : <Navigate to="/login" />} 
/>
<Route 
  path="/survey-results" 
  element={user ? <SurveyResults /> : <Navigate to="/login" />} 
/>
      </Routes>
    </div>
  );
}

export default App;