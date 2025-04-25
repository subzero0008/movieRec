import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import RatingForm from './components/RatingForm';
import ReviewsList from './components/ReviewsList';
import { addToWatched, checkIfWatched, removeFromWatched } from './services/watchedMoviesService';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchedLoading, setIsWatchedLoading] = useState(false);
  const [watchedError, setWatchedError] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const movieResponse = await fetch(`${API_URL}/movies/${id}`, {
          signal: abortController.signal,
        });
        if (!movieResponse.ok) throw new Error(`HTTP error! Status: ${movieResponse.status}`);
        const movieData = await movieResponse.json();
        setMovie(movieData);

        setIsLoadingTrailers(true);
        const trailerResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${movieData.title} official trailer&key=${YOUTUBE_API_KEY}`
        );
        if (!trailerResponse.ok) throw new Error(`HTTP error! Status: ${trailerResponse.status}`);
        const trailerData = await trailerResponse.json();
        setTrailers(trailerData.items);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching data:', error);
          setError('Failed to load data. Please try again later.');
        }
      } finally {
        setIsLoadingTrailers(false);
      }
    };

    fetchData();
    return () => abortController.abort();
  }, [id, API_URL, YOUTUBE_API_KEY]);

  useEffect(() => {
    const checkWatchedStatus = async () => {
      if (!user) return;
      try {
        const { isWatched: status } = await checkIfWatched(id, user.token);
        setIsWatched(status);
      } catch (err) {
        console.error('Error checking watched status:', err);
      }
    };
    checkWatchedStatus();
  }, [id, user]);

  const handleWatchedClick = async () => {
    if (!user?.token) {
      setWatchedError('Трябва да сте влезли в профила си');
      return;
    }
    if (!id) {
      setWatchedError('Липсва ID на филма');
      return;
    }

    setIsWatchedLoading(true);
    setWatchedError(null);

    try {
      const movieId = parseInt(id);
      if (isNaN(movieId)) throw new Error('Невалиден формат на ID на филма');

      if (isWatched) {
        await removeFromWatched(movieId, user.token);
      } else {
        await addToWatched(movieId, user.token);
      }
      setIsWatched(!isWatched);
    } catch (error) {
      const serverError =
        error.response?.data?.errors || error.response?.data?.title || error.message;
      setWatchedError(`Грешка: ${JSON.stringify(serverError)}`);
      console.error('Full Error:', error);
    } finally {
      setIsWatchedLoading(false);
    }
  };

  const officialTrailers = trailers.filter((trailer) =>
    trailer.snippet.title.toLowerCase().includes('official trailer')
  );

  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;
  if (!movie) return <p className="text-white text-center mt-8">Loading movie details...</p>;

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <Link to="/" className="text-blue-500 hover:text-blue-400 mb-6 inline-block">
        ← Back to Home
      </Link>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="md:w-1/3">
            <img
              src={movie.posterUrl || 'https://placehold.co/500x750'}
              alt={movie.title}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
            />
          </div>

          <div className="md:w-2/3">
            <h1 className="text-4xl font-bold text-white mb-4">
              {movie.title}
              {isWatched && (
                <span className="ml-3 text-yellow-400 text-sm align-middle bg-yellow-900 bg-opacity-50 px-2 py-1 rounded-full">
                  Гледан
                </span>
              )}
            </h1>
            <p className="text-lg text-white mb-6">{movie.overview || 'No synopsis available.'}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full text-white">
                <span className="font-bold">Runtime:</span> {movie.runtime ? `${movie.runtime} мин` : 'N/A'}
              </div>

              <div className="bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full text-white">
                <span className="font-bold">Release:</span> {movie.releaseDate || 'N/A'}
              </div>

              <div className="bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full">
                <span className="font-bold text-white">Rating:</span> ⭐ {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}/10
              </div>

              <button
                onClick={handleWatchedClick}
                disabled={isWatchedLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isWatched ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                } text-white transition-colors`}
              >
                {isWatchedLoading ? (
                  <span>Зареждане...</span>
                ) : (
                  <>
                    {isWatched ? <FaEyeSlash /> : <FaEye />}
                    <span>{isWatched ? 'Премахни от гледани' : 'Добави в гледани'}</span>
                  </>
                )}
              </button>
            </div>

            {watchedError && <div className="text-red-500 text-sm -mt-3 mb-3">{watchedError}</div>}

           {/* NEW SECTION: Genres, Director, Main Cast */}
<div className="space-y-4 mt-6">
  <p className="text-white">
    <span className="font-semibold">Жанрове:</span>{' '}
    {movie.genres && movie.genres.length > 0
      ? movie.genres.map(g => g.name).join(', ')
      : 'N/A'}
  </p>

  <div className="text-white">
    <span className="font-semibold block mb-2">Режисьор:</span>
    {movie.credits?.crew ? (
      <>
        {movie.credits.crew
          .filter(person => person.job === 'Director')
          .map((director, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <img
                src={
                  director.profilePath
                    ? `https://image.tmdb.org/t/p/w185${director.profilePath}`
                    : 'https://placehold.co/46x68?text=No+Image'
                }
                alt={director.name}
                className="w-12 h-16 object-cover rounded-md shadow"
              />
              <p>{director.name}</p>
            </div>
          ))}
      </>
    ) : (
      <p>N/A</p>
    )}
  </div>

  <div className="text-white">
    <span className="font-semibold block mb-2">Главни актьори:</span>
    {movie.credits?.cast && movie.credits.cast.length > 0 ? (
      <div className="flex flex-wrap gap-4">
        {movie.credits.cast.slice(0, 6).map((actor, index) => (
          <div key={index} className="w-24 text-center text-sm">
            <img
              src={
                actor.profilePath
                  ? `https://image.tmdb.org/t/p/w185${actor.profilePath}`
                  : 'https://placehold.co/92x138?text=No+Image'
              }
              alt={actor.name}
              className="rounded-md shadow-lg mb-1 w-full h-auto object-cover"
            />
            <p>{actor.name}</p>
          </div>
        ))}
      </div>
    ) : (
      <p>N/A</p>
    )}
  </div>
</div>
</div>
</div>

        {/* Trailer */}
        {isLoadingTrailers && <p className="text-white text-center mt-8">Loading trailers...</p>}

        {officialTrailers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Official Trailer</h2>
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${officialTrailers[0].id.videoId}`}
                title={officialTrailers[0].snippet.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full"
              ></iframe>
              <div className="p-4">
                <p className="text-white font-semibold">{officialTrailers[0].snippet.title}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoadingTrailers && officialTrailers.length === 0 && (
          <p className="text-white text-center mt-8">No official trailer found.</p>
        )}

        {/* Reviews and Rating Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {user && (
            <div className="lg:order-2">
              <RatingForm movieId={id} onRatingSubmit={() => {}} />
            </div>
          )}
          <div className={user ? 'lg:order-1' : ''}>
            <ReviewsList movieId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
