import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        // Fetch movie details
        const movieResponse = await fetch(`${API_URL}/movies/${id}`, { signal: abortController.signal });
        if (!movieResponse.ok) {
          throw new Error(`HTTP error! Status: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();
        console.log("Movie Data:", JSON.stringify(movieData, null, 2)); // Debugging: Check the structure of the response
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

  // Filter only official trailers
  const officialTrailers = trailers.filter((trailer) =>
    trailer.snippet.title.toLowerCase().includes("official trailer")
  );

  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;
  if (!movie) return <p className="text-white text-center mt-8">Loading movie details...</p>;

  return (
    <div className="bg-gray-900 min-h-screen p-8 flex flex-col items-center">
      <Link to="/" className="text-blue-500 hover:text-blue-400 mb-6">
        ← Back to Home
      </Link>

      <h1 className="text-5xl font-bold text-white text-center mb-6">{movie.title}</h1>

      <div className="w-full flex flex-col items-center">
        <img
          src={movie.posterUrl || 'https://placehold.co/500x750'} // Нов placeholder URL
          alt={movie.title}
          className="w-80 h-auto object-cover rounded-lg shadow-lg mb-6"
        />
        <div className="text-center max-w-2xl">
          <p className="text-lg text-white mb-4">{movie.overview || 'No synopsis available.'}</p>
          <p className="text-white mb-2">
            <span className="font-bold">Runtime:</span> {movie.runtime ? `${movie.runtime} minutes` : 'N/A'}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Release Date:</span> {movie.releaseDate || 'N/A'}
          </p>
          <p className="text-white text-xl font-semibold">
            ⭐ {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}/10
          </p>
        </div>
      </div>

      {isLoadingTrailers && <p className="text-white text-center mt-8">Loading trailers...</p>}

      {officialTrailers.length > 0 && (
        <div className="w-full max-w-4xl mt-12">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Official Trailer</h2>
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
    </div>
  );
}

export default MovieDetail;