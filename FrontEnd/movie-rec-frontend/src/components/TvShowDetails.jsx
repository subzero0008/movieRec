
import LoadingSpinner from './common/LoadingSpinner';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TvShowsService } from '../services/TvShowsService';
import ErrorMessage from './common/ErrorMessage';  
import { useAuth } from '../AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import RatingForm from '../components/RatingForm';
import ReviewsList from '../components/ReviewsList';


const TvShowDetails = () => {
    const { id } = useParams();
    const [show, setShow] = useState(null);
    const [trailers, setTrailers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);
    const { user } = useAuth();
    const [isWatched, setIsWatched] = useState(false);
    const [isWatchedLoading, setIsWatchedLoading] = useState(false);
    const [watchedError, setWatchedError] = useState(null);
  
    const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  
    useEffect(() => {
      const fetchTvShowDetails = async () => {
        try {
          const data = await TvShowsService.getDetails(Number(id));
          setShow(data);
  
          // Fetch trailers
          setIsLoadingTrailers(true);
          const trailerResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${data.name} official trailer&key=${YOUTUBE_API_KEY}`
          );
          if (!trailerResponse.ok) throw new Error(`HTTP error! Status: ${trailerResponse.status}`);
          const trailerData = await trailerResponse.json();
          setTrailers(trailerData.items);
        } catch (err) {
          setError('Failed to load TV show details');
          console.error(err);
        } finally {
          setIsLoadingTrailers(false);
        }
      };
  
      fetchTvShowDetails();
    }, [id, YOUTUBE_API_KEY]);
  
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
        setWatchedError('Липсва ID на сериала');
        return;
      }
  
      setIsWatchedLoading(true);
      setWatchedError(null);
  
      try {
        const showId = parseInt(id);
        if (isNaN(showId)) throw new Error('Невалиден формат на ID на сериала');
  
        if (isWatched) {
          await removeFromWatched(showId, user.token);
        } else {
          await addToWatched(showId, user.token);
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
  
    if (error) return <ErrorMessage message={error} />;
    if (!show) return <ErrorMessage message="TV show not found" />;
  
    return (
      <div className="bg-gray-900 min-h-screen p-8">
        <Link to="/" className="text-blue-500 hover:text-blue-400 mb-6 inline-block">
          ← Back to Home
        </Link>
  
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="md:w-1/3">
              <img
                src={`https://image.tmdb.org/t/p/w500${show.poster_path || show.posterPath}`}
                alt={show.name}
                className="w-full h-auto object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = '/placeholder-tv.jpg';
                }}
              />
            </div>
  
            <div className="md:w-2/3">
              <h1 className="text-4xl font-bold text-white mb-4">
                {show.name}
                {isWatched && (
                  <span className="ml-3 text-yellow-400 text-sm align-middle bg-yellow-900 bg-opacity-50 px-2 py-1 rounded-full">
                    Гледан
                  </span>
                )}
              </h1>
              
              <p className="text-lg text-white mb-6">{show.overview || 'No synopsis available.'}</p>
  
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full">
                  <span className="font-bold text-white">Rating:</span> ⭐ {show.vote_average?.toFixed(1) || show.voteAverage?.toFixed(1)}/10
                </div>
  
                <div className="bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full text-white">
                  <span className="font-bold">Votes:</span> {show.vote_count || show.voteCount}
                </div>
  
                <div className="bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full text-white">
                  <span className="font-bold">Seasons:</span> {show.number_of_seasons || show.seasons?.length}
                </div>
  
                <div className="bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full text-white">
                  <span className="font-bold">Episodes:</span> {show.number_of_episodes || show.seasons?.reduce((acc, season) => acc + (season.episode_count || season.episodeCount), 0)}
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
  
              {/* Genres */}
              <div className="mb-6">
                <span className="font-semibold text-white">Genres:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(show.genres || []).map(genre => (
                    <span 
                      key={genre.id}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
  
              {/* First Air Date */}
              {show.first_air_date && (
                <p className="text-white">
                  <span className="font-semibold">First Air Date:</span> {new Date(show.first_air_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
  
          {/* Trailer Section */}
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
  
          {/* Seasons Section */}
          {show.seasons && show.seasons.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Seasons</h2>
              <div className="space-y-4">
                {show.seasons
                  .filter(season => season.seasonNumber !== 0)
                  .map(season => (
                    <div key={season.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex gap-4">
                        {season.poster_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                            alt={season.name}
                            className="w-24 h-36 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="text-xl font-semibold text-white">{season.name}</h4>
                          <p className="text-gray-400">
                            {season.episode_count || season.episodeCount} episodes • {season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}
                          </p>
                          {season.overview && (
                            <p className="text-gray-300 mt-2">{season.overview}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
  
          {/* Reviews Section */}
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
  };
  
  export default TvShowDetails;