import React, { useState, useEffect } from 'react';
import { TvShowsService } from '../services/TvShowsService';

const GenreSelector = ({ onGenreSelect }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await TvShowsService.getGenres();
        setGenres(data.genres || data); // Зависи как е структуриран отговора
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) return <div>Loading genres...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="genre-selector">
      <select 
        onChange={(e) => onGenreSelect(e.target.value)}
        defaultValue=""
        className="genre-dropdown"
      >
        <option value="">All Genres</option>
        {genres.map(genre => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GenreSelector;