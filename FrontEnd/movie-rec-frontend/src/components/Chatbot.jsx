import React, { useState, useEffect, useRef } from 'react';
import { getMovieRecommendations } from '../services/openaiService';

const genreEmojis = {
  comedy: "😂",
  action: "💥",
  drama: "🎭",
  romance: "❤️",
  scifi: "👽",
  horror: "👻",
  thriller: "🔪",
  fantasy: "🧙",
  animation: "🐭"
};

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState(() => {
    // Инициализираме съобщенията директно със системното и приветственото съобщение
    const initialMessages = [{
      role: "system",
      content: `
        Ти си FilmGPT - интелигентен асистент за филмови препоръки на български език. Твоите основни задачи са:
        1. Да задаваш уточняващи въпроси за предпочитанията на потребителя
        2. Да предлагаш разнообразни филмови опции базирани на отговорите
        3. Да даваш детайлна информация за всеки филм
        4. Да поддържаш приятелски и engaging тон
        Използвай emoji за визуален акцент.
      `
    }];
    
    initialMessages.push({
      role: "assistant",
      content: `Здравейте! 👋 Аз съм вашият филмов асистент. Мога да ви помогна с:

🎬 Персонализирани филмови препоръки
🍿 Информация за конкретни филми
🏆 Препоръки на база награди или жанрове

За кои филми се интересувате? Или може да ми кажете какво настроение търсите? 😊`
    });
    
    return initialMessages;
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    likedGenres: [],
    dislikedGenres: [],
    likedMovies: [],
    dislikedMovies: []
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const enhanceUserInput = (input) => {
    if (input.length < 15 && !input.endsWith('?')) {
      return `${input} Можеш ли да ми предложиш няколко варианта с кратко описание?`;
    }
    return input;
  };

  const analyzeResponseForPreferences = (message) => {
    const lowerMsg = message.toLowerCase();
    const newPreferences = {...userPreferences};

    Object.keys(genreEmojis).forEach(genre => {
      if (lowerMsg.includes(genre)) {
        if (!newPreferences.likedGenres.includes(genre)) {
          newPreferences.likedGenres.push(genre);
        }
      }
    });

    if (lowerMsg.includes("харесва") || lowerMsg.includes("обичам")) {
      const movieMatches = message.match(/"([^"]+)"/g) || [];
      movieMatches.forEach(movie => {
        const cleanMovie = movie.replace(/"/g, '');
        if (!newPreferences.likedMovies.includes(cleanMovie)) {
          newPreferences.likedMovies.push(cleanMovie);
        }
      });
    }

    setUserPreferences(newPreferences);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const processedInput = enhanceUserInput(input);
    const userMessage = { role: "user", content: processedInput };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getMovieRecommendations([...messages, userMessage]);
      const botMessage = { role: "assistant", content: response };
      
      setMessages(prev => [...prev, botMessage]);
      analyzeResponseForPreferences(response);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Съжалявам, възникна грешка. Моля, опитайте отново по-късно." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-100">
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-yellow-400 font-bold text-xl">Филмов Експерт</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3/4 rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-yellow-500 text-gray-900' 
                : 'bg-gray-700 text-white'
            }`}>
              {msg.content.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white rounded-lg p-3">
              Мисля...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Задайте въпрос за филми..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            Изпрати
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;