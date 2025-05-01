import axios from 'axios';

const API_BASE_URL = 'https://localhost:7115/api/Survey';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.token) {
    throw new Error('Authentication required');
  }
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  };
};

const validateSurveyData = (answers) => {
  const errors = [];
  
  if (!answers.mood) errors.push('Mood selection is required');
  if (!answers.occasion) errors.push('Occasion selection is required');
  if (!answers.genres || answers.genres.length === 0) errors.push('At least one genre is required');
  if (!answers.agePreference) errors.push('Age preference is required');
  if (answers.isRatingImportant === undefined || answers.isRatingImportant === null) {
    errors.push('Rating importance is required');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
};

const submitSurveyAnswers = async (answers) => {
  try {
    // Валидация преди изпращане
    const validationErrors = [];
    if (!answers.mood) validationErrors.push("Mood is required");
    if (!answers.occasion) validationErrors.push("Occasion is required");
    if (!answers.genres?.length) validationErrors.push("At least one genre is required");
    if (!answers.agePreference) validationErrors.push("Age preference is required");
    if (answers.isRatingImportant === undefined) validationErrors.push("Rating importance is required");

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    const payload = {
      mood: String(answers.mood),
      occasion: String(answers.occasion),
      genres: Array.isArray(answers.genres) ? answers.genres : [answers.genres],
      agePreference: String(answers.agePreference),
      isRatingImportant: answers.isRatingImportant === "Yes" || answers.isRatingImportant === true,
      themes: Array.isArray(answers.themes) ? answers.themes : []
    };

    console.log("Final payload:", payload); // Важен дебъг лог

    const response = await axios.post(
      `${API_BASE_URL}/recommendations`,
      payload,
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error("Full error details:", {
      config: error.config,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

const getSurveyQuestions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/questions`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Failed to load questions:', error);
    throw new Error('Failed to load survey questions');
  }
};

// Export as default object
export default {
  getSurveyQuestions,
  submitSurveyAnswers
};