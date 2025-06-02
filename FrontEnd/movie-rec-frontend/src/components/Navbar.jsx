import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { MoviesService } from '../services/MoviesService';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Автоматично фокусиране на търсачката при отваряне на мобилното меню
  useEffect(() => {
    if (isMobileMenuOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileMenuOpen]);

  // Затваряне на менютата при промяна на location
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  // Добавяне на клавишни комбинации (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
  
    setIsSearching(true);
    try {
      const results = await MoviesService.searchMovies(searchQuery);
      navigate('/search-results', { 
        state: { 
          movies: results.movies, 
          query: searchQuery 
        } 
      });
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error searching for movies', error);
      // Можете да добавите toast notification тук
    } finally {
      setIsSearching(false);
    }
  };
  return (
    <nav className="bg-gradient-to-r from-gray-900 to-blue-900 text-white shadow-xl">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>

      <div className="flex items-center justify-between h-16">
        {/* Logo and main navigation */}
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <span className="ml-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
              FilmSense
              
            </span>
            
          </Link>
  
{/* Desktop Navigation */}
<div className="hidden md:flex items-center flex-1">
  {/* Линкове отляво */}
  <div className="flex items-center space-x-4"> {/* Променено от items-baseline на items-center */}
    <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-800 hover:text-white transition duration-300">
      Home
    </Link>
    <Link to="/movies" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-800 hover:text-white transition duration-300">
      Movies
    </Link>
    {user && (
      <>
        <Link to="/tv" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700">
          TV Series
        </Link>
        <Link
          to="/polls/active"
          className="px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Vote
        </Link>
        <Link
          to="/recommendations"
          className="px-3 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-500 text-white transition duration-300 flex items-center"
          title={user.ratedMoviesCount < 10 ? "Трябва да оцените поне 10 филма за препоръки" : ""}
        >
          <span className="flex items-center">
           Top 10 recommendations
            {user.ratedMoviesCount >= 10 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-700 rounded-full">
                New
              </span>
            )}
          </span>
        </Link>
      </>
    )}
  </div>
{/* Search Bar в средата */}
<div className="mx-4 flex-1 max-w-xl">
  <form onSubmit={handleSearch} className="relative">
    <input
      type="text"
      ref={searchInputRef}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search movie..."
      className="w-full py-2 pl-4 pr-10 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
    />
    <button
      type="submit"
      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-200"
      disabled={isSearching}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.65 6.15z"
        />
      </svg>
    </button>
  </form>
</div>

{/* Линкове отдясно */}
<div className="flex items-baseline space-x-4">
  {user && (
    <>
      <Link
        to="/survey"
        className="px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Poll
          <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-green-100 bg-green-700 rounded-full animate-pulse">
            NEW
          </span>
        </div>
      </Link>
    </>
  )}
</div>
</div>


          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-blue-800 focus:outline-none transition duration-300"
            >
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? 'hidden' : 'block'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? 'block' : 'hidden'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Profile/Sign-in */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="relative ml-3">
                  <div>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center max-w-xs rounded-full bg-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-white transition duration-300"
                    >
                      <span className="sr-only">Отвори потребителско меню</span>
                      <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 mr-1 text-sm font-medium">
                        {user.username}
                      </span>
                      <svg
                        className={`ml-1 h-4 w-4 transition-transform ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
{/* Profile dropdown */}
{isProfileOpen && (
  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none z-50">
    {/* Административни функции (видими само за админи) */}
    {user?.role === 'Admin' && (
      <>
        <Link
          to="/admin/users"
          onClick={() => setIsProfileOpen(false)}
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
        >
          Manage Useres
        </Link>
        <Link
          to="/admin/reviews"
          onClick={() => setIsProfileOpen(false)}
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
        >
          Manage Reviews
        </Link>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
      </>
    )}

    {/* Функции за Cinema */}
    {user?.role === 'Cinema' && (
      <Link
        to="/polls/create"
        onClick={() => setIsProfileOpen(false)}
        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
      >
        Create Poll
      </Link>
    )}

    {/* Общи функции за всички логнати потребители */}
    <Link
      to="/top-rated"
      onClick={() => setIsProfileOpen(false)}
      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
    >
      Top Ratings
    </Link>
    <Link
      to="/profile"
      onClick={() => setIsProfileOpen(false)}
      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
    >
      Profile
    </Link>
    <Link
      to="/watched"
      onClick={() => setIsProfileOpen(false)}
      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
    >
      Watched movies
    </Link>

    {/* Разделителна линия */}
    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

    {/* Бутон за изход */}
    <button
      onClick={handleLogout}
      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 transition duration-200"
    >
      Log Out
    </button>
  </div>
)}

                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white transition duration-300"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-500 text-white transition duration-300"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-800">
          {/* Mobile Search Bar */}
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търсене на филми..."
                className="w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 pl-10"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
              >
                {isSearching ? (
                  <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </form>
          </div>

          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Movies
            </Link>
            {user && (
              <Link
                to="/watchlist"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                List
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-blue-700">
            {user ? (
              <>
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.username}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/watched"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700"
                  >
                    Watched Movies
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}