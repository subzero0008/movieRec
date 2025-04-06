import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import RatingForm from './components/RatingForm';
import RatingsSummary from './components/RatingsSummary';
import ReviewsList from './components/ReviewsList';

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        // Fetch movie details
        const movieResponse = await fetch(`${API_URL}/movies/${id}`, { 
          signal: abortController.signal 
        });
        if (!movieResponse.ok) {
          throw new Error(`HTTP error! Status: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch trailers
        setIsLoadingTrailers(true);
        const trailerResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${movieData.title} official trailer&key=${YOUTUBE_API_KEY}`
        );
        if (!trailerResponse.ok) {
          throw new Error(`HTTP error! Status: ${trailerResponse.status}`);
        }
        const trailerData = await trailerResponse.json();
        setTrailers(trailerData.items);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching data:", error);
          setError("Failed to load data. Please try again later.");
        }
      } finally {
        setIsLoadingTrailers(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [id, API_URL, YOUTUBE_API_KEY]);

  const handleRatingSubmit = () => {
    // Можете да добавите логика за обновяване на данните след като бъде добавен нов рейтинг
    console.log('Rating submitted - refresh data if needed');
  };

  // Filter only official trailers
  const officialTrailers = trailers.filter((trailer) =>
    trailer.snippet.title.toLowerCase().includes("official trailer")
  );

  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;
  if (!movie) return <p className="text-white text-center mt-8">Loading movie details...</p>;

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <Link to="/" className="text-blue-500 hover:text-blue-400 mb-6 inline-block">
        ← Back to Home
      </Link>

      <div className="max-w-6xl mx-auto">
        {/* Movie Header Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="md:w-1/3">
            <img
              src={movie.posterUrl || 'https://placehold.co/500x750'}
              alt={movie.title}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
            />
          </div>
          
          <div className="md:w-2/3">
            <h1 className="text-4xl font-bold text-white mb-4">{movie.title}</h1>
            <p className="text-lg text-white mb-6">{movie.overview || 'No synopsis available.'}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-white">
                  <span className="font-bold">Runtime:</span> {movie.runtime ? `${movie.runtime} minutes` : 'N/A'}
                </p>
                <p className="text-white">
                  <span className="font-bold">Release Date:</span> {movie.releaseDate || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-white text-xl">
                  <span className="font-bold">Rating:</span> ⭐ {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}/10
                </p>
              </div>
            </div>
            
            {/* Ratings Summary - добавено ново */}
            <RatingsSummary movieId={id} />
          </div>
        </div>

        {/* Trailers Section - запазен оригинален код */}
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

        {/* New Ratings & Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Rating Form - добавено ново (само за логнати потребители) */}
          {user && (
            <div className="lg:order-2">
              <RatingForm movieId={id} onRatingSubmit={handleRatingSubmit} />
            </div>
          )}
          
          {/* Reviews List - добавено ново */}
          <div className={user ? "lg:order-1" : ""}>
            <ReviewsList movieId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;