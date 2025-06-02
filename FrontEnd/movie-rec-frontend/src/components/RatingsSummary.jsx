import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

export default function RatingsSummary({ movieId, onReviewUpdate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [userReview, setUserReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRating, setEditedRating] = useState(3);
  const [editedReview, setEditedReview] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Зареждане на обобщението
        const summaryResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/summary/${movieId}`
        );
        
        if (!summaryResponse.ok) throw new Error('Failed to load ratings summary');
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);

        // Ако потребителят е логнат, зареди неговото ревю
        if (user?.token) {
          const userReviewResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/user-review/${movieId}`,
            {
              headers: {
                'Authorization': `Bearer ${user.token}`
              }
            }
          );
          
          if (userReviewResponse.ok) {
            const reviewData = await userReviewResponse.json();
            setUserReview(reviewData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId, user?.token]);

  const handleEdit = () => {
    setEditedRating(userReview?.rating || 3);
    setEditedReview(userReview?.review || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/${movieId}`,
        {
          method: userReview ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            rating: editedRating,
            review: editedReview
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save review');

      setIsEditing(false);
      if (onReviewUpdate) onReviewUpdate(); // Нотифициране на родителя за промяна
      // Презареждане на данните
      const [summaryRes, reviewRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/summary/${movieId}`),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/user-review/${movieId}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);

      setSummary(await summaryRes.json());
      setUserReview(reviewRes.ok ? await reviewRes.json() : null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете вашето ревю?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/${movieId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete review');

      setUserReview(null);
      if (onReviewUpdate) onReviewUpdate();
      
      // Презареждане на обобщението
      const summaryRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/movieratings/summary/${movieId}`
      );
      setSummary(await summaryRes.json());
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-white py-4">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6">
      <h3 className="text-xl text-white mb-4">Rating</h3>
      
      {/* Обобщена информация */}
      {summary && summary.totalRatings > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white">Averege rating:</span>
            <span className="text-yellow-400 font-bold">
              {summary.averageRating.toFixed(1)}/5
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white">All reviews:</span>
            <span className="text-white">{summary.totalRatings}</span>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center">
                <span className="text-white w-8">{stars}★</span>
                <div className="flex-1 bg-gray-700 h-2 rounded-full mx-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{
                      width: `${(summary.distribution[stars] / summary.totalRatings) * 100}%`
                    }}
                  />
                </div>
                <span className="text-gray-300 text-sm w-8">
                  {summary.distribution[stars]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 mb-6">No ratings Yet</div>
      )}

      {/* Потребителско ревю */}
      {user?.token && (
        <div className="border-t border-gray-700 pt-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-white">Rating:</span>
                <select
                  value={editedRating}
                  onChange={(e) => setEditedRating(Number(e.target.value))}
                  className="bg-gray-700 text-white p-1 rounded"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <textarea
                value={editedReview}
                onChange={(e) => setEditedReview(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
                rows="3"
                placeholder="Вашето мнение за филма..."
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-600 text-white rounded"
                >
                  Cancel
                </button>
                {userReview && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ) : userReview ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-yellow-400">Вашият рейтинг: {userReview.rating}/5</span>
                <div className="space-x-2">
                  <button
                    onClick={handleEdit}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {userReview.review && (
                <p className="text-white mt-2">{userReview.review}</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Rating
            </button>
          )}
        </div>
      )}
    </div>
  );
}