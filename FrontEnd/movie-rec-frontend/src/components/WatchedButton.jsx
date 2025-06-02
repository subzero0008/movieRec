import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { addToWatched, removeFromWatched, checkIfWatched } from '../services/watchedMoviesService';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function WatchedButton({ tmdbMovieId, movieTitle, posterPath }) {
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkWatchedStatus = async () => {
      if (!user?.token) return;
      
      try {
        const { isWatched: status } = await checkIfWatched(tmdbMovieId, user.token);
        setIsWatched(status);
      } catch (err) {
        console.error('Error checking watched status:', err);
      }
    };
    
    checkWatchedStatus();
  }, [tmdbMovieId, user]);

  const handleClick = async () => {
    if (!user?.token) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (isWatched) {
        await removeFromWatched(tmdbMovieId, user.token);
      } else {
        await addToWatched(tmdbMovieId, movieTitle, posterPath, user.token);
      }
      setIsWatched(!isWatched);
    } catch (err) {
      setError(err.response?.data?.message || 'Error in proceeding');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="watched-button-container">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          isWatched ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
        } text-white transition-colors`}
      >
        {loading ? (
          'Зареждане...'
        ) : (
          <>
            {isWatched ? <FaEyeSlash /> : <FaEye />}
            <span>{isWatched ? 'Remove from the List' : 'Add to the List'}</span>
          </>
        )}
      </button>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}