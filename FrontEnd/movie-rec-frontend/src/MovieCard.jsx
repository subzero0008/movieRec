import { Link } from 'react-router-dom';

const MovieCard = ({ movie, showRecommendationBadge = false }) => {
  // Форматиране на датата за по-добро четене
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Показване на топ 2 жанра
  const displayGenres = movie.mainGenres?.slice(0, 2).join(' • ') || '';

  return (
    <Link 
      to={`/movies/${movie.id}`} 
      className="block transform transition-transform duration-300 hover:scale-105 relative"
    >
      {/* Badge за препоръки (ако е активиран) */}
      {showRecommendationBadge && movie.relevanceScore && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          {Math.round(movie.relevanceScore * 100)}% Match
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
        <div className="relative">
          <img
            src={movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}`}
            alt={movie.title}
            className="w-full h-80 object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-movie.jpg';
              e.target.className = 'w-full h-80 object-cover bg-gray-700';
            }}
          />
        </div>

        <div className="p-4 flex-grow">
          <h3 className="text-lg font-bold text-white truncate" title={movie.title}>
            {movie.title}
          </h3>
          
          {movie.releaseDate && (
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(movie.releaseDate)}
            </p>
          )}

          {displayGenres && (
            <p className="text-gray-300 text-sm mt-1 truncate">
              {displayGenres}
            </p>
          )}

          <div className="flex items-center mt-2">
            <span className="text-yellow-400 mr-1">⭐</span>
            <span className="text-yellow-400">
              {movie.voteAverage?.toFixed(1) || 'N/A'}/10
            </span>
          </div>
        </div>
      </div>
    </Link>
  );з
};

export default MovieCard;