import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  return (
    <Link to={`/movies/${movie.id}`} className="block transform transition-transform duration-300 hover:scale-105">
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <img
          src={movie.posterUrl || `https://image.tmdb.org/t/p/w500${movie.posterPath}`} // Използваме posterUrl, ако е предоставен, иначе генерираме от posterPath
          alt={movie.title}
          className="w-full h-80 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-bold text-white">{movie.title}</h3>
          <p className="text-gray-400">📅 Release Date: {movie.releaseDate}</p>
          <p className="text-yellow-400">⭐ Rating: {movie.voteAverage}/10</p>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;