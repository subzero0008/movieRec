// src/components/tv-shows/TvShowsList.jsx
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { TvShowsService } from '../services/TvShowsService';
import TvShowCard from '../TVShowCard';
const TvShowsList = () => {
    const [tvShows, setTvShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('trending');
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
  
    // Функция за зареждане на TV shows
    const loadTvShows = async (category = 'trending', genreId = '') => {
      try {
        setLoading(true);
        setError(null);
        
        let data;
        if (genreId) {
          // Временна заглушка - използваме trending, докато не имплементираме getByGenre
          data = await TvShowsService.getTrending();
        } else {
          switch (category) {
            case 'trending':
              data = await TvShowsService.getTrending();
              break;
            case 'popular':
              data = await TvShowsService.getPopular();
              break;
            case 'top-rated':
              data = await TvShowsService.getTopRated();
              break;
            default:
              data = await TvShowsService.getTrending();
          }
        }
        
        // Проверка за валидни данни
        if (!Array.isArray(data)) {
          throw new Error('Received invalid data format from API');
        }
        
        setTvShows(data);
      } catch (err) {
        setError(err.message || 'Failed to load TV shows');
        console.error('Error loading TV shows:', err);
      } finally {
        setLoading(false);
      }
    };
  
    // Първоначално зареждане
    useEffect(() => {
      const initialize = async () => {
        try {
          // Зареждаме trending shows и жанрове паралелно
          const [showsData, genresData] = await Promise.all([
            TvShowsService.getTrending(),
            TvShowsService.getGenres()
          ]);
          
          setTvShows(showsData);
          setGenres(genresData);
        } catch (err) {
          setError('Failed to initialize data');
          console.error('Initialization error:', err);
        } finally {
          setLoading(false);
        }
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
      setSelectedGenre('');
      loadTvShows(category);
    };
  
    if (loading) {
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
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            {selectedCategory === 'trending' && 'Trending TV Shows'}
            {selectedCategory === 'popular' && 'Popular TV Shows'}
            {selectedCategory === 'top-rated' && 'Top Rated TV Shows'}
            {selectedGenre && `TV Shows: ${genres.find(g => g.id == selectedGenre)?.name || 'Selected Genre'}`}
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
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1 text-sm rounded-full ${selectedGenre == genre.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
  
        {/* Списък с TV shows */}
        {tvShows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tvShows.map((show) => (
             <TvShowCard 
             key={show.id}
             show={{
               id: show.id,
               name: show.name,
               posterPath: show.posterPath,
               voteAverage: show.voteAverage,
               firstAirDate: show.firstAirDate,
               voteCount: show.voteCount,
               genreIds: show.genreIds // Подаваме genreIds от API отговора
             }}
             allGenres={genres} // Подаваме целия списък с жанрове
           />
            ))}
          </div>
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


