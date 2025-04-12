import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movies = [], query = '' } = location.state || {};

  // Функция за обработка на клик върху филм
  const handleMovieClick = (tmdbMovieId, e) => {
    // Предотвратяване на стандартното поведение на Link
    e.preventDefault();
    navigate(`/movies/${tmdbMovieId}`);
  };

  // Ако няма данни, ще се покаже съобщение
  useEffect(() => {
    if (!location.state) {
      console.warn('No search data available. Redirecting might be necessary.');
    }
  }, [location.state]);

  if (!location.state) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center p-8">
          <h2 className="text-2xl font-bold mb-4">No search data available</h2>
          <p className="mb-4">Please try your search again.</p>
          <Link 
            to="/" 
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded transition duration-300"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center p-8">
          <h2 className="text-2xl font-bold mb-4">No movies found for "{query}"</h2>
          <p className="mb-4">Try different search terms.</p>
          <Link 
            to="/movies" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Browse All Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-400 text-lg">
            Found {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group cursor-pointer"
              onClick={(e) => handleMovieClick(movie.tmdbMovieId || movie.id, e)}
            >
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 h-full flex flex-col">
                <div className="relative pt-[150%] overflow-hidden">
                  <img
                    src={movie.posterUrl || 'https://via.placeholder.com/500x750?text=No+Poster'}
                    alt={movie.title}
                    className="absolute top-0 left-0 w-full h-full object-cover transition duration-500 group-hover:opacity-80"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                    }}
                  />
                </div>
                <div className="p-4 flex-grow">
                  <h2 className="text-xl font-bold text-white mb-2 truncate">{movie.title}</h2>
                  <div className="flex items-center text-yellow-400 mb-2">
                    {movie.voteAverage && (
                      <>
                        <svg className="w-5 h-5 fill-current mr-1" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{movie.voteAverage.toFixed(1)}/10</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;