import axios from 'axios';

// Вместо process.env използваме import.meta.env за Vite
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const getMovieRecommendations = async (messages) => {
  try {
    const response = await axios.post(
      OPENAI_ENDPOINT,
      {
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return "Съжалявам, възникна грешка при обработката на заявката ви.";
  }
};