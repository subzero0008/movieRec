import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://movierec-backend-7jqo.onrender.com/api';

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' }, { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'first_air_date.desc', label: 'Newest First' },
  { value: 'first_air_date.asc', label: 'Oldest First' },
];

export default function AdvancedTVSearch() {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [minRating, setMinRating] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const toggleGenre = (id) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedGenres.length > 0) params.append('genres', selectedGenres.join(','));
      if (sortBy) params.append('sortBy', sortBy);
      if (minRating) params.append('minRating', minRating);
      if (yearFrom) params.append('yearFrom', `${yearFrom}-01-01`);
      if (yearTo) params.append('yearTo', `${yearTo}-12-31`);

      const response = await fetch(`${API_URL}/tv/discover?${params.toString()}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      navigate('/tv/search-results', {
        state: { shows: data.results, query: 'Advanced Search Results' }
      });
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSortBy('popularity.desc');
    setMinRating('');
    setYearFrom('');
    setYearTo('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200 mb-8 text-center">
          Advanced TV Search
        </h1>
        <form onSubmit={handleSearch} className="bg-gray-800 rounded-xl p-8 shadow-xl space-y-6">
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-3">Genres</label>
            <div className="flex flex-wrap gap-2">
              {TV_GENRES.map(g => (
                <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    selectedGenres.includes(g.id)
                      ? 'bg-yellow-500 text-gray-900 font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-4 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Min Rating (0-10)</label>
              <input type="number" value={minRating} onChange={(e) => setMinRating(e.target.value)}
                placeholder="e.g. 7.0" min="0" max="10" step="0.5"
                className="w-full py-2 px-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
            </div>
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">From Year</label>
              <input type="number" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
                placeholder="e.g. 2010" min="1900" max="2026"
                className="w-full py-2 px-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
            </div>
          </div>

          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">To Year</label>
            <input type="number" value={yearTo} onChange={(e) => setYearTo(e.target.value)}
              placeholder="e.g. 2024" min="1900" max="2026"
              className="w-full py-2 px-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-4">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-md transition duration-300 disabled:opacity-50">
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
            <button type="button" onClick={handleReset}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition duration-300">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
