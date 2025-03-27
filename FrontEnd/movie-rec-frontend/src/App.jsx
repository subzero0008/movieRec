import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';

function App() {
  const [trendingMovies, setTrendingMovies] = useState([]); // Състояние за trending movies
  const [searchResults, setSearchResults] = useState([]); // Състояние за резултати от търсенето
  const [loading, setLoading] = useState(true); // Състояние за зареждане
  const [error, setError] = useState(null); // Състояние за грешки
  const [isSearching, setIsSearching] = useState(false); // Флаг за търсене
  const [searchQuery, setSearchQuery] = useState(''); // Състояние за заявката за търсене

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api';

  // Зареждане на trending movies при първоначално зареждане
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
        setTrendingMovies(data.results || []); // Записваме trending movies
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setError('Failed to load trending movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, [API_URL]);

  // Функция за търсене на филми
  const handleSearch = async (e) => {
    e.preventDefault(); // Спиране на поведението по подразбиране на формата

    if (!searchQuery.trim()) {
      setIsSearching(false); // Ако заявката е празна, показваме trending movies
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true); // Показваме, че се извършва търсене

    try {
      const response = await fetch(`${API_URL}/movies/search?query=${searchQuery}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data || []); // Записваме резултатите от търсенето
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('Failed to search movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Показване на съобщение за зареждане
  if (loading) {
    return <div className="text-white text-center mt-8">Loading...</div>;
  }

  // Показване на съобщение за грешка
  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  // Определяне на филмите, които трябва да се покажат
  const moviesToDisplay = isSearching ? searchResults : trendingMovies;

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <Routes>
        {/* Главна страница */}
        <Route path="/" element={
          <>
            <h1 className="text-4xl font-bold text-white text-center mb-12">
              {isSearching ? 'Search Results' : 'Trending Movies'}
            </h1>
            <div className="flex justify-end mb-8">
              <form onSubmit={handleSearch}> {/* Добавена форма за търсене */}
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // Промяна на заявката за търсене
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
        } />

        {/* Страница за детайли на филм */}
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Routes>
    </div>
  );
}

export default App;