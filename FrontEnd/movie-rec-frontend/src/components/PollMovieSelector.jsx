import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar';
import { MoviesService } from '../services/MoviesService';

const PollMovieSelector = ({ onMoviesSelected }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const noPosterSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
    <rect width="500" height="750" fill="%232d3748"/>
    <text x="250" y="375" font-family="Arial" font-size="24" fill="%23a0aec0" text-anchor="middle">No Poster</text>
  </svg>`;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await MoviesService.searchMovies(searchQuery);
      setSearchResults(results.movies || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch search results');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

const handleAddMovie = (movie) => {
  if (selectedMovies.some(m => m.id === movie.id)) return;
  const newSelection = [...selectedMovies, movie];
  setSelectedMovies(newSelection);
};

const handleRemoveMovie = (movieId) => {
  const newSelection = selectedMovies.filter(movie => movie.id !== movieId);
  setSelectedMovies(newSelection);
};


  const navigateToAdvancedSearch = () => {
    navigate('/search-movies', {
      state: {
        query: searchQuery,
        movies: searchResults
      }
    });
  };

  if (isSearching) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Searching for "{searchQuery}"...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Error searching for movies</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="mr-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/movies')}
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Browse All Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="flex-grow w-full md:w-auto">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="w-full md:w-auto px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded transition duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Search Results for "{searchQuery}"
              </h3>
              <button
                onClick={navigateToAdvancedSearch}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Advanced Search
              </button>
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
            {searchResults.map((movie) => (
              <div key={movie.id} className="group relative">
                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 h-full flex flex-col">
                  <div className="relative pt-[150%] overflow-hidden">
                    <img
                      src={movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}` || noPosterSvg}
                      alt={movie.title}
                      className="absolute top-0 left-0 w-full h-full object-cover transition duration-500 group-hover:opacity-80"
                      onError={(e) => {
                        e.target.src = noPosterSvg;
                        e.target.className = `${e.target.className} bg-gray-700`;
                      }}
                    />
                  </div>
                  <div className="p-4 flex-grow">
                    <h2 className="text-lg font-bold text-white mb-2 truncate">{movie.title}</h2>
                    <div className="flex items-center text-yellow-400 mb-2">
                      {movie.voteAverage && (
                        <>
                          <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm">{movie.voteAverage.toFixed(1)}/10</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">
                      {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddMovie(movie);
                  }}
                  className={`absolute top-2 right-2 ${
                    selectedMovies.some(m => m.id === movie.id)
                      ? 'bg-green-600'
                      : 'bg-gray-800 hover:bg-green-600'
                  } text-white font-bold py-1 px-2 rounded-full transition duration-300`}
                  title={selectedMovies.some(m => m.id === movie.id) ? "Already added" : "Add to poll"}
                >
                  {selectedMovies.some(m => m.id === movie.id) ? '✓' : '+'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Movies Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">
            Selected Movies ({selectedMovies.length})
          </h3>

          {selectedMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedMovies.map((movie) => (
                <div key={movie.id} className="relative group">
                  <div className="bg-gray-700 rounded-lg overflow-hidden shadow-md">
                    <div className="relative pt-[150%] overflow-hidden">
                      <img
                        src={movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}` || noPosterSvg}
                        alt={movie.title}
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
                        onError={(e) => {
                          e.target.src = noPosterSvg;
                          e.target.className = `${e.target.className} bg-gray-700`;
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <h4 className="text-sm font-medium text-white truncate">{movie.title}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMovie(movie.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-full transition duration-300 opacity-0 group-hover:opacity-100"
                    title="Remove from poll"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No movies selected yet</p>
          )}

     {selectedMovies.length > 0 && (
  <div className="flex justify-end mt-6">
    <button
      onClick={() => onMoviesSelected && onMoviesSelected(selectedMovies)}
      className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded transition duration-300"
    >
      Confirm Selection
    </button>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default PollMovieSelector;
