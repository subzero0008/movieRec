import { Link } from 'react-router-dom';

const MovieCard = ({ movie, showRecommendationBadge = false, showBothRatings = false }) => {
  // Format date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show top 2 genres
  const displayGenres = movie.mainGenres?.slice(0, 2).join(' • ') || '';

  return (
    <Link 
      to={`/movies/${movie.id}`} 
      className="block transform transition-transform duration-300 hover:scale-105 relative"
    >
      {/* Recommendation badge (if enabled) */}
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-20"></div>
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

          {/* TMDB Rating (always shown) */}
          <div className="flex items-center mt-2">
  <span className="text-yellow-400 mr-1">⭐</span>
  <span className="text-yellow-400">
    {movie.tmdbRating !== undefined ? movie.tmdbRating.toFixed(1) : 
     movie.voteAverage !== undefined ? movie.voteAverage.toFixed(1) : 'N/A'}/10
  </span>
  <span className="text-gray-400 text-xs ml-1">TMDB</span>
</div>
          {/* Local Rating (only shown if showBothRatings is true) */}
          {showBothRatings && movie.localRating && (
            <div className="flex items-center mt-1">
              <span className="text-blue-400 mr-1">★</span>
              <span className="text-blue-400">
                {movie.localRating?.toFixed(1)}/5
              </span>
              {movie.ratingCount && (
                <span className="text-gray-400 text-xs ml-1">
                  ({movie.ratingCount} {movie.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;