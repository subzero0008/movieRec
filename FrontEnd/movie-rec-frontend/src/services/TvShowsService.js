import axios from 'axios';

const API_BASE_URL = 'https://localhost:7115'; // Уверете се, че това е правилният URL

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const TvShowsService = {
  async getTrending(language = 'en-US', page = 1) {
    try {
      const response = await instance.get('/api/tv/trending', {
        params: { language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
      throw error;
    }
  },

  async getPopular(language = 'en-US', page = 1) {
    try {
      const response = await instance.get('/api/tv/popular', {
        params: { language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      throw error;
    }
  },

  async getTopRated(language = 'en-US', page = 1) {
    try {
      const response = await instance.get('/api/tv/top-rated', {
        params: { language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || 1,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      throw error;
    }
  },

  async getDetails(id, language = 'en-US') {
    try {
      const response = await instance.get(`/api/tv/${id}`, {
        params: { language }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      throw error;
    }
  },

  async getGenres(language = 'en-US') {
    try {
      const response = await instance.get('/api/tv/genres', {
        params: { language }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show genres:', error);
      throw error;
    }
  },

  async getByGenre(genreId, language = 'en-US', page = 1) {
    try {
      const response = await instance.get(`/api/tv/genre/${genreId}`, {
        params: { language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || page,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error(`Error fetching TV shows for genre ${genreId}:`, error);
      throw error;
    }
  },

  async search(query, language = 'en-US', page = 1) {
    try {
      const response = await instance.get('/api/tv/search', {
        params: { query, language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || page,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error(`Error searching TV shows for "${query}":`, error);
      throw error;
    }
  },

  async getSimilar(id, language = 'en-US', page = 1) {
    try {
      const response = await instance.get(`/api/tv/${id}/similar`, {
        params: { language, page }
      });
      return {
        shows: response.data.results || response.data,
        page: response.data.page || page,
        totalPages: response.data.total_pages || 1,
        totalResults: response.data.total_results || (response.data.results ? response.data.results.length : 0)
      };
    } catch (error) {
      console.error(`Error fetching similar TV shows for ID ${id}:`, error);
      throw error;
    }
  }
};