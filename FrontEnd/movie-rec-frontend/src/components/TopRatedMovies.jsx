import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopRatedMoviesAllTime, getTopRatedMovies } from '../services/movieRatings';
import { useAuth } from '../AuthContext';
import MovieCard from '../MovieCard';

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 99, name: 'Documentary' }
];

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'Febuary' },
  { value: 3, label: 'Mach' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const TopRatedMovies = () => {
  const { user, isCinema } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    genreId: null,
    year: new Date().getFullYear(),
    month: null
  });
  const [timePeriod, setTimePeriod] = useState('All time');

  useEffect(() => {
    if (isCinema) {
      fetchTopRatedMovies();
    }
  }, [isCinema, filters]);

  const fetchTopRatedMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (!filters.genreId && !filters.month) {
        data = await getTopRatedMoviesAllTime();
        setMovies(data.movies);
        setTimePeriod('All time');
      } else {
        data = await getTopRatedMovies(filters);
        setMovies(data.movies);
        setTimePeriod(data.timePeriod);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genreId: null,
      year: new Date().getFullYear(),
      month: null
    });
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (!isCinema) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Current user role: {user?.role || 'none'} | 
              You need Cinema role to access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">Top Rated Movies</h1>
          <p className="text-xl text-indigo-200">{timePeriod}</p>
        </div>

        <div className="bg-indigo-900 rounded-xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-indigo-100 text-sm font-medium mb-2">Genre</label>
              <select
                className="w-full p-3 bg-indigo-800 border border-indigo-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.genreId || ''}
                onChange={(e) => handleFilterChange('genreId', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="" className="bg-indigo-800">All Genres</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id} className="bg-indigo-800">
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-indigo-100 text-sm font-medium mb-2">Year</label>
              <select
                className="w-full p-3 bg-indigo-800 border border-indigo-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year} className="bg-indigo-800">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-indigo-100 text-sm font-medium mb-2">Month</label>
              <select
                className="w-full p-3 bg-indigo-800 border border-indigo-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.month || ''}
                onChange={(e) => handleFilterChange('month', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="" className="bg-indigo-800">All Months</option>
                {months.map(month => (
                  <option key={month.value} value={month.value} className="bg-indigo-800">
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="mt-6 px-6 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
            onClick={clearFilters}
          >
            <span className="mr-2">✕</span> Clear Filters
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-indigo-200">Loading movies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
{movies.map(movie => {
  console.log("Movie Data:", {
    id: movie.movieId,
    tmdbRating: movie.tmdbVoteAverage,
    localRating: movie.averageRating
  });

  return (
    <MovieCard 
    key={movie.movieId}
    movie={{
      id: movie.movieId,
      title: movie.title,
      posterPath: movie.posterPath,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate,
      mainGenres: movie.mainGenres,
      tmdbRating: movie.tmdbVoteAverage, // подава се към tmdbRating
      localRating: movie.averageRating,   // подава се към localRating
      ratingCount: movie.ratingCount
    }}
    showBothRatings={true}
  />

  );
})}

          </div>
        )}
      </div>
    </div>
  );
};

export default TopRatedMovies;