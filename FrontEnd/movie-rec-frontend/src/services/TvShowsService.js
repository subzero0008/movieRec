import axios from 'axios';

const API_BASE_URL = 'https://localhost:7115'; // Уверете се, че това е правилният URL

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const TvShowsService = {
  async getTrending() {
    try {
      const response = await instance.get('/api/tv/trending');
      return response.data; // Директно връщаме масива с TV shows
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
      throw error;
    }
  },

  async getPopular() {
    try {
      const response = await instance.get('/api/tv/popular');
      return response.data;
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      throw error;
    }
  },

  async getTopRated() {
    try {
      const response = await instance.get('/api/tv/top-rated');
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      throw error;
    }
  },
  async getDetails(id) {
    try {
      const response = await instance.get(`/api/tv/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      throw error;
    }
  },
  async getGenres() {
    try {
      const response = await instance.get('/api/tv/genres');
      return response.data; // Директно връщаме масива с жанрове
    } catch (error) {
      console.error('Error fetching TV show genres:', error);
      throw error;
    }
  },
  

  // Временна заглушка - ще я имплементираме по-късно
  async getByGenre(genreId) {
    try {
      const response = await instance.get('/api/tv/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching TV shows by genre:', error);
      throw error;
    }
  }
};