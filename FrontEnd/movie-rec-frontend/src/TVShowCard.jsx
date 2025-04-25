import { Link } from 'react-router-dom';

const TvShowCard = ({ show, showRecommendationBadge = false, allGenres = [] }) => {
  // Проверка за липсващ show обект
  if (!show || !show.id) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
        <div className="aspect-[2/3] bg-gray-700"></div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white">No show data</h3>
        </div>
      </div>
    );
  }

  // Форматиране на датата
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  // Преобразуване на genreIds в имена на жанрове
  const getGenreNames = () => {
    if (show.genreNames) return show.genreNames;
    if (show.genres) return show.genres.map(g => g.name);
    
    if (show.genreIds && allGenres.length > 0) {
      return show.genreIds
        .map(id => allGenres.find(g => g.id === id)?.name)
        .filter(name => name);
    }
    
    return [];
  };

  // Подготовка на постера
  const getPosterUrl = () => {
    if (show.posterPath) {
      return `https://image.tmdb.org/t/p/w500${show.posterPath}`;
    }
    return '/placeholder-tv.jpg';
  };

  const displayGenres = getGenreNames().slice(0, 2).join(' • ');

  return (
    <Link 
      to={`/tv/${show.id}`} // Уверете се, че този път съвпада с вашите маршрути
      className="block transform transition-transform duration-300 hover:scale-105 relative group"
      state={{ from: 'tvshows' }} // Допълнителни данни за навигация
    >
      {/* Badge за препоръки */}
      {showRecommendationBadge && show.relevanceScore && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          {Math.round(show.relevanceScore * 100)}% Match
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
        {/* Постер изображение */}
        <div className="relative aspect-[2/3]">
          <img
            src={getPosterUrl()}
            alt={`Poster for ${show.name}`}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.target.src = '/placeholder-tv.jpg';
              e.target.className = 'w-full h-full object-cover bg-gray-700 group-hover:opacity-90 transition-opacity';
            }}
          />
          {/* Рейтинг overlay */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-yellow-400 px-2 py-1 rounded-md flex items-center">
            <span className="mr-1">⭐</span>
            <span className="font-semibold">
              {show.voteAverage ? show.voteAverage.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Детайли */}
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-bold text-white truncate" title={show.name}>
            {show.name || 'No title'}
          </h3>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-400 text-sm">
              {formatDate(show.firstAirDate)}
            </span>
            
            {show.voteCount && (
              <span className="text-gray-400 text-sm">
                {show.voteCount.toLocaleString()} votes
              </span>
            )}
          </div>

          {displayGenres && (
            <p className="text-gray-300 text-xs mt-2 truncate">
              {displayGenres}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TvShowCard;