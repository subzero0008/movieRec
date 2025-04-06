import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function ReviewsList({ movieId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://localhost:7115/api/movieratings/${movieId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user?.token}` // Добавяме токена само ако потребителят е логнат
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setReviews(data.ratings); // Запазваме само масива с ревюта
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [movieId, user?.token]); // Добавяме user?.token като dependency

  if (loading) return <div className="text-white py-4">Зареждане на ревюта...</div>;
  if (error) return <div className="text-red-500 py-4">Грешка: {error}</div>;
  if (reviews.length === 0) return <div className="text-gray-400 py-4">Няма ревюта все още</div>;

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-2xl font-bold text-white">
        Потребителски ревюта ({reviews.length})
      </h3>
      
      {reviews.map((review) => (
        <div key={`${review.userId}-${review.ratedOn}`} className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-yellow-400 font-bold text-lg mr-2">
                {review.rating}/5
              </span>
              <span className="text-gray-300 text-sm">
                {new Date(review.ratedOn).toLocaleDateString('bg-BG')}
              </span>
            </div>
            <span className="text-blue-300 font-medium">
              {review.userName || 'Анонимен потребител'}
            </span>
          </div>
          <p className="text-white text-lg">
            {review.review || "Няма предоставен текст"}
          </p>
        </div>
      ))}
    </div>
  );
}