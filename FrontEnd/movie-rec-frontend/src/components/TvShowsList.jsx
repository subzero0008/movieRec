import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TvShowsService } from '../services/TvShowsService';
import TvShowCard from '../TVShowCard';

const TvShowsList = () => {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const categoryRef = useRef('trending');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Функция за зареждане на TV shows
  const loadTvShows = async (category = 'trending', genreId = null, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://movierec-backend-7jqo.onrender.com/api';
      if (genreId) {
        const sortBy = category === 'popular' ? 'popularity.desc'
          : category === 'top-rated' ? 'vote_average.desc'
          : 'popularity.desc';
        const params = new URLSearchParams({ genres: genreId, sortBy, page });
        if (category === 'top-rated') params.append('minRating', '7.0');
        const res = await fetch(`${API_URL}/tv/discover?${params}`);
        const data = await res.json();
        response = { shows: data.results, page: data.page, totalPages: data.totalPages, totalResults: data.totalResults };
      } else {
        switch (category) {
          case 'trending':
            response = await TvShowsService.getTrending('en-US', page);
            break;
          case 'popular':
            response = await TvShowsService.getPopular('en-US', page);
            break;
          case 'top-rated':
            response = await TvShowsService.getTopRated('en-US', page);
            break;
          default:
            response = await TvShowsService.getTrending('en-US', page);
        }
      }
      
      if (page > 1) {
        setTvShows(prev => [...prev, ...response.shows]);
      } else {
        setTvShows(response.shows);
      }
      
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalResults(response.totalResults);
    } catch (err) {
      setError(err.message || 'Failed to load TV shows');
      console.error('Error loading TV shows:', err);
    } finally {
      setLoading(false);
    }
  };

  // Зареждане на жанровете
  const loadGenres = async () => {
    try {
      const genresData = await TvShowsService.getGenres();
      setGenres(genresData);
    } catch (err) {
      console.error('Error loading genres:', err);
    }
  };

  // Първоначално зареждане
  useEffect(() => {
    const initialize = async () => {
      await loadGenres();
      await loadTvShows(selectedCategory);
    };

    initialize();
  }, []);

  // Ефект за смяна на жанра
  useEffect(() => {
    if (selectedGenre) {
      loadTvShows(selectedCategory, selectedGenre);
    }
  }, [selectedGenre]);

  // Функция за смяна на категорията
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    categoryRef.current = category;
    setSelectedGenre(null);
    loadTvShows(category, null);
  };

  // Функция за смяна на жанра
  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId === selectedGenre ? null : genreId);
  };

  // Функция за зареждане на следваща страница
  const loadMore = () => {
    const nextPage = currentPage + 1;
    loadTvShows(selectedCategory, selectedGenre, nextPage);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={() => window.location.reload()} 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
        >
          <svg className="fill-current h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M14.66 15.66A8 8 0 1 1 17 10h-2a6 6 0 1 0-1.76 4.24l1.42 1.42zM12 10h8l-4 4-4-4z"/>
          </svg>
        </button>
      </div>
    );
  }

  // Генерираме заглавие в зависимост от избраната категория/жанр
  const getTitle = () => {
    if (selectedGenre) {
      const genre = genres.find(g => g.id === selectedGenre);
      return genre ? `${genre.name} TV Shows (${totalResults} results)` : 'TV Shows by Genre';
    }
    
    switch (selectedCategory) {
      case 'trending': return totalResults > 0 ? `Trending TV Shows (${totalResults} results)` : 'Trending TV Shows';
      case 'popular': return totalResults > 0 ? `Popular TV Shows (${totalResults} results)` : 'Popular TV Shows';
      case 'top-rated': return totalResults > 0 ? `Top Rated TV Shows (${totalResults} results)` : 'Top Rated TV Shows';
      default: return 'TV Shows';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
          {getTitle()}
        </h1>
        
        <Link 
          to="/tv/search" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          Advanced Search
        </Link>
      </div>

      {/* Категории и жанрове */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCategoryChange('trending')}
            className={`px-4 py-2 rounded-full ${selectedCategory === 'trending' && !selectedGenre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Trending
          </button>
          <button
            onClick={() => handleCategoryChange('popular')}
            className={`px-4 py-2 rounded-full ${selectedCategory === 'popular' && !selectedGenre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Popular
          </button>
          <button
            onClick={() => handleCategoryChange('top-rated')}
            className={`px-4 py-2 rounded-full ${selectedCategory === 'top-rated' && !selectedGenre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Top Rated
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreChange(genre.id)}
              className={`px-3 py-1 text-sm rounded-full transition ${selectedGenre === genre.id ? 'bg-yellow-500 text-gray-900 font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {genre.name}
            </button>
          ))}
        </div>
        {selectedGenre && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => loadTvShows(categoryRef.current, selectedGenre)}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-full transition"
            >
              🎬 Apply Filter
            </button>
            <button
              onClick={() => { setSelectedGenre(null); loadTvShows(categoryRef.current, null); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition text-sm"
            >
              ✕ Clear Genre
            </button>
          </div>
        )}
      </div>

      {/* Списък с TV shows */}
      {tvShows.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tvShows.map((show) => (
              <TvShowCard 
                key={show.id}
                show={{
                  id: show.id,
                  name: show.name,
                  posterPath: show.poster_path || show.posterPath,
                  voteAverage: show.vote_average || show.voteAverage,
                  firstAirDate: show.first_air_date || show.firstAirDate,
                  voteCount: show.vote_count || show.voteCount,
                  genreIds: show.genre_ids || show.genreIds
                }}
                allGenres={genres}
              />
            ))}
          </div>
          
          {/* Бутон за зареждане на още */}
          {currentPage < totalPages && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Loading...' : `Load More (Page ${currentPage} of ${totalPages})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-xl">No TV shows found</p>
          <button 
            onClick={() => loadTvShows(selectedCategory, selectedGenre)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default TvShowsList;