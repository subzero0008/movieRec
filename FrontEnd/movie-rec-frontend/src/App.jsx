import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminUsers from './components/AdminUsersPage';
import AdminReviews from './components/AdminReviews';
import UserEditModal from './components/UserEditModal';
import Chatbot from './components/Chatbot'; // Добавен импорт за Chatbot

// Импортиране на всички необходими компоненти
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
import TopRatedMovies from './components/TopRatedMovies';
import CreatePollForm from './components/CreatePollForm';
import PollMovieSearchResults from './components/PollMovieSearchResults';
import ActivePollsPage from './components/ActivePollsPage';
import EditPollPage from './components/EditPollPage';

function App() {
  // Състояния за тренди филми, търсене, зареждане и грешки
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatbot, setShowChatbot] = useState(false); // Състояние за показване на чатбота

  // Извличане на потребител и logout функция от AuthContext
  const { user, logout, token } = useAuth() || {};
  
  // Базов URL за API-то (може да е от .env или локален fallback)
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api';

  // Извличане на тренди филмите при първоначално зареждане на приложението
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

  // Обработка на търсене
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
      // Извикване на търсене чрез сервиз
      const results = await MoviesService.searchMovies(searchQuery);
      setSearchResults(results.movies);
      
      // Пренасочване към страницата с резултати от търсене
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

  // Изход на потребителя
  const handleLogout = () => {
    logout();
  };

  // Ако търсим – показваме резултатите, иначе тренди филми
  const moviesToDisplay = isSearching ? searchResults : trendingMovies;

  // Показваме индикатор при зареждане
  if (loading) {
    return <div className="text-white text-center mt-8">Loading...</div>;
  }

  // Показваме съобщение при грешка
  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-8 relative">
      {/* Навигационна лента */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Бутон за отваряне на чатбота */}
      <button 
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 left-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-full shadow-lg transition duration-300 z-50 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

   {showChatbot && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="w-full max-w-4xl h-[80vh] bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
      <Chatbot onClose={() => setShowChatbot(false)} />
    </div>
  </div>
)}

      {/* Определяне на маршрути */}
      <Routes>
        {/* Начална страница – показва тренди или търсени филми */}
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

        {/* Динамични и статични маршрути */}
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Профил и защитени маршрути */}
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/watched" element={user ? <WatchedMoviesList /> : <Navigate to="/login" />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/recommendations" element={user ? <Recommendations /> : <Navigate to="/login" />} />
        <Route path="/movies" element={<MoviesList />} />
        <Route path="/top-rated" element={<TopRatedMovies />} />

        {/* Добавени маршрути за TV Shows */}
        <Route path="/tv" element={<TvShowsList />} />
        <Route path="/tv/:id" element={<TvShowDetails />} />

        {/* Маршрути за анкетата */}
        <Route 
          path="/survey" 
          element={user ? <Survey /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/survey-results" 
          element={user ? <SurveyResults /> : <Navigate to="/login" />} 
        />
        <Route path="/polls/active" element={<ActivePollsPage />} />
        <Route path="/create-poll" element={<CreatePollForm />} />
        <Route 
          path="/polls/create" 
          element={<CreatePollForm token={token} />} 
        />
        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
        </Route>
        <Route 
          path="/poll-movie-search" 
          element={<PollMovieSearchResults onAddMovie={(movie) => {
            // Това ще се извика, когато потребителят избере филм
            navigate(-1); // Връщане назад
            // Логиката за добавяне на филма ще се обработва в CreatePollForm
          }} />} 
        />
        <Route path="/polls/edit/:id" element={<EditPollPage />} />
      </Routes>
    </div>
  );
}

export default App;