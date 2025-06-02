import axios from 'axios';

const API_BASE_URL = 'https://localhost:7115/api/movieratings';

// Помощна функция за вземане на токена от localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getTopRatedMoviesAllTime = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/top-rated-all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top rated movies (all time):', error);
    throw error;
  }
};

export const getTopRatedMovies = async (filters = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const { genreId, year, month } = filters;
    const params = new URLSearchParams();
    
    if (genreId) params.append('genreId', genreId);
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const response = await axios.get(`${API_BASE_URL}/top-rated?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    throw error;
  }
};

export const deleteRating = async (movieId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/${movieId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};