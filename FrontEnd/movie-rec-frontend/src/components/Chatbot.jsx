import React, { useState, useEffect, useRef } from 'react';

const Chatbot = ({ onClose }) => {
  const INITIAL_MESSAGE = {
    role: "assistant",
    content: `Hello! 👋 I'm your AI Movie Expert. I can help you with:\n\n🎬 Personalized movie recommendations\n🍿 Information about specific films\n🏆 Award-winning and genre-based suggestions\n🎭 Finding movies based on your mood\n\nWhat kind of movies are you looking for? 😊`
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('filmsense_chat_history');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    try {
      localStorage.setItem('filmsense_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || "https://movierec-backend-7jqo.onrender.com/api";
      const response = await fetch(`${API_URL}/chat/movie-expert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are FilmSense AI - an intelligent movie recommendation assistant. 
Your tasks are:
1. Ask clarifying questions about user preferences
2. Suggest diverse movie options based on their answers
3. Provide detailed information about each film (year, director, cast, plot)
4. Maintain a friendly and engaging tone
5. Always respond in English
6. Use emojis for visual emphasis
7. Format movie recommendations clearly with title, year, and brief description`,
          messages: messages
            .filter(m => m.role !== 'system')
            .concat(userMessage)
            .map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      const botReply = data.text || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: botReply }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again later. 🙏"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-100">
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <h3 className="text-yellow-400 font-bold text-xl">FilmSense AI</h3>
          <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full font-semibold">Movie Expert</span>
        </div>
        <button
            onClick={() => {
              const initial = [{role: "assistant", content: "Hello! 👋 I'm your AI Movie Expert. How can I help you today?"}];
              setMessages(initial);
              localStorage.removeItem('filmsense_chat_history');
            }}
            className="text-gray-400 hover:text-red-400 transition-colors text-xs mr-3"
            title="Clear history"
          >
            🗑️ Clear
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3/4 rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-700 text-white'
            }`} style={{maxWidth: '80%'}}>
              {msg.content.split('\n').map((line, idx) => (
                <p key={idx} className={line === '' ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white rounded-lg p-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
              <span className="text-sm text-gray-400">Thinking...</span>
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
            placeholder="Ask about movies..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
