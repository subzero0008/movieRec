import React, { useState } from 'react';
import axios from 'axios';

const SearchBar = ({ setMovies }) => {
  const [query, setQuery] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await axios.get(`https://localhost:7115/api/movies/search?query=${query}`);
      setMovies(response.data); // Записваме резултатите в state
    } catch (error) {
      console.error('Error searching for movies', error);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for movies"
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;