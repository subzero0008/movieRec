import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Добавяне на request interceptor за автентикация
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken'); // Или от вашата система за управление на състоянието
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export const MoviesService = {
  async getTrending(page = 1) {
    try {
      const response = await instance.get('/movies/trending', {
        params: { page }
      });
      return {
        movies: response.data.results || [],
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || 0
      };
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw error;
    }
  },

  async getPopular(page = 1) {
    try {
      const response = await instance.get('/movies/popular', {
        params: { page }
      });
      return {
        movies: response.data.results || [],
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || 0
      };
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  },

  async getTopRated(page = 1) {
    try {
      const response = await instance.get('/movies/top-rated', {
        params: { page }
      });
      return {
        movies: response.data.results || [],
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || 0
      };
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  },

  async getByGenre(genreId, page = 1) {
    try {
      const response = await instance.get(`/movies/genre/${genreId}`, {
        params: { page }
      });
      return {
        movies: response.data.results || [], // Поправено от results (беше results)
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || 0
      };
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  async getGenres() {
    try {
      const response = await instance.get('/movies/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching movie genres:', error);
      throw error;
    }
  },

  async searchMovies(query, page = 1) {
    try {
      const response = await instance.get('/movies/search', {
        params: { query, page }
      });
      
      // Дебъг логиране
      console.log('Search API Response:', response.data);
      
      return {
        movies: response.data.results || response.data || [], // Добавен fallback към response.data
        page: page,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results?.length || 0)
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }
};