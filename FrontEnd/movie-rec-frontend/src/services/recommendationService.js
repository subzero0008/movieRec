import axios from 'axios';

const API_BASE_URL = 'https://localhost:7115/api';

export const getRecommendations = async (count = 10) => {
  // Взимаме токена от localStorage
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/Recommendations/recommendations`, { 
      params: { count },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Recommendation error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    if (error.response?.status === 401) {
      // Автоматично логаут при невалиден токен
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.reload(); // Презареждаме за чист slate
    }
    
    throw error;
  }
};