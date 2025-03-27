import { Link } from "react-router-dom";

function SearchResults({ movies }) {
  if (movies.length === 0) {
    return <div className="text-white text-center mt-8">No movies found.</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen flex justify-center items-center p-8">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Search Results</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id}>
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <img
                  src={movie.posterUrl || 'https://placehold.co/500x750'}
                  alt={movie.title}
                  className="w-full h-96 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{movie.title}</h2>
                  <p className="text-gray-400 text-sm">Release Date: {movie.releaseDate || 'N/A'}</p>
                  <p className="text-gray-400 text-sm">Rating: {movie.voteAverage || 'N/A'}/10</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;