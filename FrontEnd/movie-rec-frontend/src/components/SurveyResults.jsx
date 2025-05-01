import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import MovieCard from '../MovieCard';

const SurveyResults = () => {
  const { state } = useLocation();
  const movies = state?.movies || [];

  // Функция за генериране на уникален ключ
  const getUniqueKey = (movie, index) => {
    return `${movie.id}_${index}`; // Комбинираме ID с индекс за уникалност
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Вашите персонализирани препоръки
        </h1>
        
        {movies.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-xl text-gray-300">
              Не успяхме да намерим идеални съвпадения. Опитайте да промените предпочитанията си.
            </p>
            <Link 
              to="/survey" 
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Опитайте отново
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {movies.map((movie, index) => (
              <div key={getUniqueKey(movie, index)} className="group relative">
                <Link to={`/movies/${movie.id}`} className="block">
                  <MovieCard 
                    movie={{
                      ...movie,
                      releaseDate: movie.releaseDate || movie.releaseYear,
                      genres: movie.genreInfo || movie.genres || []
                    }} 
                    showRecommendationBadge={index < 3}
                  />
                </Link>
                
                <div className="mt-2">
                  {index < 3 && (
                    <div className="text-sm font-semibold text-blue-400">
                      Съвпадение: {Math.round((1 - index * 0.15) * 100)}%
                    </div>
                  )}
                  <div className="text-sm text-gray-400 truncate">
                    {movie.mainGenres?.join(' • ') || 
                     movie.genreInfo?.map(g => g.name).join(' • ') || 
                     movie.genres?.join(' • ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/survey"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Опитайте с други предпочитания
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;