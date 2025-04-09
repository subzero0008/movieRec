import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWatchedMovies, removeFromWatched } from '../services/watchedMoviesService';

export default function WatchedMoviesList() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWatchedMovies = async () => {
      if (!user?.token) return;
      
      try {
        const response = await getWatchedMovies(user.token);
        setMovies(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Грешка при зареждане');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchedMovies();
  }, [user]);

  const handleRemove = async (tmdbMovieId) => {
    if (!window.confirm('Сигурни ли сте, че искате да премахнете този филм от списъка?')) {
      return;
    }
    
    try {
      await removeFromWatched(tmdbMovieId, user.token);
      setMovies(movies.filter(movie => movie.tmdbMovieId !== tmdbMovieId));
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при премахване');
    }
  };

  const handleMovieClick = (tmdbMovieId) => {
    navigate(`/movies/${tmdbMovieId}`); // Изпращаме tmdbMovieId като id параметър
  };

  if (!user) return <div>Трябва да сте влезли в профила си</div>;
  if (loading) return <div>Зареждане...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (movies.length === 0) return <div>Нямате гледани филми</div>;

  return (
    <div className="watched-movies-list p-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Гледани филми</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map(movie => (
          <div 
            key={movie.id} 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:scale-[1.02] transition-transform duration-200"
            onClick={() => handleMovieClick(movie.tmdbMovieId)}
          >
            <div className="relative">
              <img 
                src={movie.posterUrl || 'https://placehold.co/200x300?text=No+Poster'}
                alt={movie.localizedTitle}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/200x300?text=No+Poster';
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-1">{movie.localizedTitle}</h3>
              <p className="text-gray-300 text-sm mb-2">{movie.title !== movie.localizedTitle && `(${movie.title})`}</p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {movie.genres.map(genre => (
                  <span key={genre} className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                    {genre}
                  </span>
                ))}
              </div>
              
              <div className="text-xs text-gray-400 mb-3">
                <p>Година: {movie.releaseYear}</p>
                <p>Добавен на: {new Date(movie.watchedOn).toLocaleDateString('bg-BG')}</p>
              </div>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-300 mb-1">Актьори:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {movie.cast.slice(0, 3).map(actor => (
                    <li key={`${movie.id}-${actor.name}`}>
                      {actor.name} <span className="text-gray-500">като</span> {actor.character}
                    </li>
                  ))}
                  {movie.cast.length > 3 && (
                    <li className="text-gray-500">+ още {movie.cast.length - 3}</li>
                  )}
                </ul>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(movie.tmdbMovieId);
                }}
                className="w-full mt-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Премахни
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}