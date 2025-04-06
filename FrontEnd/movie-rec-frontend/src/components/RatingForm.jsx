import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function RatingForm({ movieId, initialRating = null, onRatingSubmit }) {
  const [rating, setRating] = useState(initialRating?.rating || 5);
  const [review, setReview] = useState(initialRating?.review || '');
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Добавяме токена в headers, ако съществува
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch('https://localhost:7115/api/movieratings/rate', {
        method: 'POST',
        headers,
        credentials: 'include', // Важно за бисквитките
        body: JSON.stringify({
          movieId: Number(movieId),
          rating: Number(rating),
          review: review.trim()
        })
      });

      // Автоматично обработване на 401 грешки
      if (response.status === 401) {
        throw new Error('Сесията ви изтече. Моля, влезте отново.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Грешка при изпращането на ревюто');
      }

      const data = await response.json();
      setSuccessMessage(data.message);
      if (onRatingSubmit) onRatingSubmit(data);

    } catch (err) {
      console.error('Rating submission error:', err);
      setError(err.message || 'Неочаквана грешка при изпращането');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-xl text-white mb-4">
        {initialRating ? 'Редактирайте вашето ревю' : 'Добавете вашето ревю'}
      </h3>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white mb-2">Рейтинг:</label>
          <select 
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="p-2 rounded-md w-full bg-white text-black"
            disabled={isLoading}
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'звезда' : 'звезди'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-white mb-2">Ревю:</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="p-2 rounded-md w-full text-black"
            rows="4"
            disabled={isLoading}
            placeholder="Напишете вашето мнение за филма..."
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md ${
              isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            disabled={isLoading}
          >
            {isLoading ? 'Запазване...' : initialRating ? 'Обнови' : 'Изпрати'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
          {error.includes('Сесията') && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-600 underline"
            >
              Обнови страницата
            </button>
          )}
        </div>
      )}
    </div>
  );
}