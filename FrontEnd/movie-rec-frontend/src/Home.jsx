import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar'; // Импортирайте SearchBar компонента

function Home() {
  const [trendingMovies, setTrendingMovies] = useState([]); // Състояние за trending movies
  const [searchResults, setSearchResults] = useState([]); // Състояние за резултати от търсенето
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false); // Флаг, който показва дали се извършва търсене

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Функция за търсене на филми
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setIsSearching(false); // Ако заявката е празна, показваме trending movies
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true); // Показваме, че се извършва търсене

    try {
      const response = await fetch(`${API_URL}/movies/search?query=${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.results); // Записваме резултатите от търсенето
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('Failed to search movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
        setTrendingMovies(data.results); // Записваме trending movies
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, [API_URL]);

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
      {/* Заглавие с впечатляващ шрифт */}
      <h1 className="text-6xl font-bold text-white text-center mb-12 font-mono bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
        {isSearching ? 'Search Results' : 'Trending Movies'}
      </h1>

      {/* Търсачка */}
      <div className="flex justify-end mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Центрирана мрежа с филми */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {moviesToDisplay.length > 0 ? (
          moviesToDisplay.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="group">
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-96 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{movie.title}</h2>
                  <p className="text-gray-400 text-sm">{movie.release_date}</p>
                  <p className="text-gray-400 text-sm">Rating: {movie.vote_average}/10</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-white text-center mt-8">No movies found.</div>
        )}
      </div>
    </div>
  );
}

export default Home;