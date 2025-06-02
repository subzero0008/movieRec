import axios from 'axios';

const API_URL = 'https://localhost:7115/api/polls';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = user?.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.error('No auth token available - redirecting to login');
    window.location.href = '/login';
    return Promise.reject(new Error('No auth token available'));
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - redirect to login');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Endpoint not found');
          break;
        default:
          console.error('API Error:', error.response.status);
      }
    }
    return Promise.reject(error);
  }
);

const pollService = {
  /**
   * Create new poll
   * @param {object} pollData - Poll data including title, description, dates and movie IDs
   */
  createPoll: async (pollData) => {
    const response = await apiClient.post('', pollData);
    return response.data;
  },

  /**
   * Get all active polls with cinema info
   */
  getActivePolls: async () => {
    const response = await apiClient.get('/active');
    return response.data;
  },

  /**
   * Get detailed information about specific poll
   * @param {number} pollId - ID of the poll
   */
  getPollDetails: async (pollId) => {
    const response = await apiClient.get(`/${pollId}`);
    return response.data;
  },

  /**
   * Update existing poll
   * @param {number} pollId - ID of the poll to update
   * @param {object} pollData - Updated poll data
   */
  updatePoll: async (pollId, pollData) => {
    const response = await apiClient.put(`/${pollId}`, pollData);
    return response.data;
  },

  /**
   * Delete a poll
   * @param {number} pollId - ID of the poll to delete
   */
  deletePoll: async (pollId) => {
    const response = await apiClient.delete(`/${pollId}`);
    return response.data;
  },

  /**
   * Submit vote for a movie in poll
   * @param {number} pollId - ID of the poll
   * @param {number} movieId - TMDB movie ID
   */
  vote: async (pollId, movieId) => {
    const response = await apiClient.post(`/${pollId}/vote/${movieId}`);
    return response.data;
  },

  /**
   * Get results for a poll
   * @param {number} pollId - ID of the poll
   */
  getPollResults: async (pollId) => {
    const response = await apiClient.get(`/${pollId}/results`);
    return response.data;
  },

  /**
   * Check if current user has voted in a poll
   * @param {number} pollId - ID of the poll
   */
  checkVoteStatus: async (pollId) => {
    try {
      const response = await apiClient.get(`/${pollId}/vote-status`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { hasVoted: false };
      }
      throw error;
    }
  }
};

export default pollService;