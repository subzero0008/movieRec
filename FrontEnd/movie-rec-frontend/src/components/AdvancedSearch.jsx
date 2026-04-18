import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoviesService } from '../services/MoviesService';

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const genres = [
    { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' }, { id: 36, name: 'History' },
    { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' }, { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() && !genre) return;
    setLoading(true);
    try {
      if (genre && !query.trim()) {
        navigate(`/movies?genre=${genre}`);
        return;
      }
      const results = await MoviesService.searchMovies(query);
      let filtered = results.movies;
      if (year) {
        filtered = filtered.filter(m => m.releaseDate?.startsWith(year));
      }
      if (genre) {
        filtered = filtered.filter(m => m.genreIds?.includes(Number(genre)));
      }
      navigate('/search-results', { state: { movies: filtered, query } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200 mb-8 text-center">
          Advanced Search
        </h1>
        <form onSubmit={handleSearch} className="bg-gray-800 rounded-xl p-8 shadow-xl space-y-6">
          {/* Search Query */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Movie Title</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter movie title..."
              className="w-full py-2 px-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Release Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2023"
              min="1900"
              max="2026"
              className="w-full py-2 px-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full py-2 px-4 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">All Genres</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-md transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>
    </div>
  );
}
