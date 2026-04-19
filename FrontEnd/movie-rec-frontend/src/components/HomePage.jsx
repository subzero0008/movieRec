import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import MovieCard from '../MovieCard';

const HomePage = ({ trendingMovies, isSearching, searchResults }) => {
  const { user } = useAuth();
  const moviesToDisplay = isSearching ? searchResults : trendingMovies;

  return (
    <div className="min-h-screen bg-gray-900">
      {!isSearching && (
        <div className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 py-20 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
                FilmSense
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8">
              Your intelligent movie companion — discover, explore, and get personalized recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/movies" className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-full transition duration-300 shadow-lg">
                Browse Movies
              </Link>
              <Link to="/tv" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition duration-300 shadow-lg">
                TV Series
              </Link>
              {user ? (
                <Link to="/recommendations" className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-full transition duration-300 shadow-lg">
                  My Recommendations
                </Link>
              ) : (
                <Link to="/register" className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-full transition duration-300 shadow-lg">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {!isSearching && (
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/movies/search" className="bg-gray-800 rounded-xl p-6 text-center transition hover:scale-105 duration-300 shadow-lg border border-gray-700 hover:border-yellow-500">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-yellow-400 font-bold text-lg mb-2">Advanced Search</h3>
            <p className="text-gray-400 text-sm">Filter by genre, rating, year and more</p>
          </Link>
          <Link to="/polls/active" className="bg-gray-800 rounded-xl p-6 text-center transition hover:scale-105 duration-300 shadow-lg border border-gray-700 hover:border-orange-500">
            <div className="text-4xl mb-3">🗳️</div>
            <h3 className="text-orange-400 font-bold text-lg mb-2">Vote and Polls</h3>
            <p className="text-gray-400 text-sm">Vote for upcoming cinema screenings</p>
          </Link>
          {user ? (
            <Link to="/survey" className="bg-gray-800 rounded-xl p-6 text-center transition hover:scale-105 duration-300 shadow-lg border border-gray-700 hover:border-green-500">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-green-400 font-bold text-lg mb-2">Mood Survey</h3>
              <p className="text-gray-400 text-sm">Get recommendations based on your mood</p>
            </Link>
          ) : (
            <Link to="/register" className="bg-gray-800 rounded-xl p-6 text-center transition hover:scale-105 duration-300 shadow-lg border border-gray-700 hover:border-green-500">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-green-400 font-bold text-lg mb-2">Mood Survey</h3>
              <p className="text-gray-400 text-sm">Sign up to get mood-based recommendations</p>
            </Link>
          )}
          <Link to="/top-rated" className="bg-gray-800 rounded-xl p-6 text-center transition hover:scale-105 duration-300 shadow-lg border border-gray-700 hover:border-blue-500">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-blue-400 font-bold text-lg mb-2">Top Rated</h3>
            <p className="text-gray-400 text-sm">See what our community rates highest</p>
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200 mb-6">
          {isSearching ? 'Search Results' : 'Trending Now'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {moviesToDisplay.length > 0 ? (
            moviesToDisplay.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={{
                  id: movie.id,
                  title: movie.title,
                  posterUrl: movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}`,
                  releaseDate: movie.releaseDate,
                  voteAverage: movie.voteAverage,
                }}
              />
            ))
          ) : (
            <div className="text-gray-400 text-center col-span-full mt-8">No movies found</div>
          )}
        </div>
        {!isSearching && (
          <div className="text-center mt-8">
            <Link to="/movies" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-yellow-400 font-semibold rounded-full border border-yellow-500 hover:border-yellow-400 transition duration-300">
              View All Movies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
