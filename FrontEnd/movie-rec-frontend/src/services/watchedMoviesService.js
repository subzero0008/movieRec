import axios from 'axios';

const API_URL = 'https://localhost:7115/api/watchedmovies';

const getAuthConfig = (token) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

export const addToWatched = async (tmdbMovieId, token) => {
    try {
      const response = await axios.post(
        API_URL,
        { 
          tmdbMovieId: Number(tmdbMovieId) // Явно преобразуване към число
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  };

export const getWatchedMovies = async (token) => {
  try {
    const response = await axios.get(API_URL, getAuthConfig(token));
    return response.data;
  } catch (error) {
    console.error('Error fetching watched movies:', error);
    throw error;
  }
};

export const removeFromWatched = async (tmdbMovieId, token) => {
  try {
    const response = await axios.delete(
      `${API_URL}/${tmdbMovieId}`,
      getAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error removing from watched:', error);
    throw error;
  }
};

export const checkIfWatched = async (tmdbMovieId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/check/${tmdbMovieId}`,
      getAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error checking watched status:', error);
    throw error;
  }
};