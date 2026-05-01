import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import MovieCard from '../MovieCard';
import { useState, useEffect } from 'react';

const AnimatedStat = ({ value, label }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = parseInt(value);
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev + step >= target) { clearInterval(timer); return target; }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-yellow-400">{count.toLocaleString()}+</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color, to, delay }) => (
  <Link to={to} className="group relative bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center border border-gray-700 transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden" style={{animationDelay: `${delay}ms`}}>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${color}`}></div>
    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
    <h3 className={`font-bold text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r ${color}`}>{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
  </Link>
);

const HomePage = ({ trendingMovies, isSearching, searchResults }) => {
  const { user } = useAuth();
  const moviesToDisplay = isSearching ? searchResults : trendingMovies;
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {!isSearching && (
        <>
          {/* HERO */}
          <div className="relative overflow-hidden bg-gray-900 py-24 px-6">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'2s'}}></div>
            </div>
            <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)',backgroundSize:'50px 50px'}}></div>
            <div className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                AI-Powered Movie Recommendations
              </div>
              <h1 className="text-6xl sm:text-7xl font-extrabold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400">
                FilmSense
              </h1>
              <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                Your intelligent movie companion — discover films tailored to your taste, mood, and preferences.
              </p>
              <p className="text-gray-500 text-sm mb-10">Powered by TMDb • Groq AI • Real-time recommendations</p>
              <div className="flex flex-wrap justify-center gap-4 mb-16">
                <Link to="/movies" className="group px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-full transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/50 hover:scale-105 flex items-center gap-2">
                  🎬 Browse Movies
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/tv" className="px-8 py-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold rounded-full border border-blue-500/50 hover:border-blue-400 transition-all duration-300 hover:scale-105">
                  📺 TV Series
                </Link>
                {user ? (
                  <Link to="/recommendations" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full border border-gray-600 hover:border-yellow-500 transition-all duration-300 hover:scale-105">
                    ⭐ My Recommendations
                  </Link>
                ) : (
                  <Link to="/register" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full border border-gray-600 hover:border-yellow-500 transition-all duration-300 hover:scale-105">
                    🚀 Get Started Free
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto pt-8 border-t border-gray-800">
                <AnimatedStat value="1000000" label="Movies & Shows" />
                <AnimatedStat value="150" label="Countries" />
                <AnimatedStat value="50" label="Genres" />
              </div>
            </div>
          </div>

          {/* RECOMMENDED */}
          {user && (
            <div className="max-w-5xl mx-auto px-6 py-8">
              <div className="relative bg-gradient-to-r from-yellow-900/20 via-gray-800/80 to-blue-900/20 border border-yellow-500/20 rounded-3xl p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div className="text-6xl">⭐</div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-2">Recommended For You</h2>
                    <p className="text-gray-300 mb-1">Get personalized picks based on your taste.</p>
                    <p className="text-gray-500 text-sm">Rate at least <span className="text-yellow-400 font-semibold">10 movies</span> and add to your watched list to unlock smart recommendations.</p>
                  </div>
                  <Link to="/recommendations" className="shrink-0 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/25">
                    View Picks →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* FEATURES */}
          <div className="max-w-6xl mx-auto px-6 py-8">
            <h2 className="text-center text-gray-500 text-sm font-semibold uppercase tracking-widest mb-8">What you can do</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard icon="🔍" title="Advanced Search" desc="Filter by genre, rating, year, runtime and cast" color="from-yellow-400 to-yellow-600" to="/movies/search" delay={0} />
              <FeatureCard icon="🗳️" title="Vote & Polls" desc="Vote for upcoming cinema and streaming screenings" color="from-orange-400 to-red-500" to="/polls/active" delay={100} />
              <FeatureCard icon="📋" title="Mood Survey" desc="Tell us your mood — we'll find the perfect film" color="from-green-400 to-emerald-600" to="/survey" delay={200} />
              <FeatureCard icon="🏆" title="Top Rated" desc="Discover what our community rates highest" color="from-blue-400 to-purple-500" to="/top-rated" delay={300} />
            </div>
          </div>

          {/* AI PROMO */}
          <div className="max-w-5xl mx-auto px-6 py-4 mb-8">
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6 flex items-center gap-4">
              <div className="text-4xl">🤖</div>
              <div className="flex-1">
                <h3 className="text-purple-300 font-bold">AI Movie Expert</h3>
                <p className="text-gray-400 text-sm">Chat with our AI powered by Llama 3.3 — ask anything about movies, get tailored suggestions, explore genres.</p>
              </div>
              <div className="text-gray-500 text-sm shrink-0 hidden sm:block">Click the 💬 button</div>
            </div>
          </div>
        </>
      )}

      {/* TRENDING */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
            {isSearching ? '🔍 Search Results' : '🔥 Trending Now'}
          </h2>
          {!isSearching && (
            <Link to="/movies" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors">
              View all →
            </Link>
          )}
        </div>
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
            <div className="text-gray-400 text-center col-span-full mt-8 py-12">
              <div className="text-6xl mb-4">🎬</div>
              <p>No movies found</p>
            </div>
          )}
        </div>
        {!isSearching && moviesToDisplay.length > 0 && (
          <div className="text-center mt-10">
            <Link to="/movies" className="inline-flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-yellow-400 font-semibold rounded-full border border-yellow-500/50 hover:border-yellow-400 transition-all duration-300 hover:scale-105">
              Explore All Movies
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
