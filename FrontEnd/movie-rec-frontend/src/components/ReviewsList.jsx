import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';


export default function ReviewsList({ movieId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    review: ''
  });

  useEffect(() => {
    console.log('AuthContext User:', user); // 🐛 Дебъг: user от контекста
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(``${import.meta.env.VITE_API_BASE_URL || "${import.meta.env.VITE_API_BASE_URL || "https://movierec-backend-7jqo.onrender.com/api"}"}`/movieratings/${movieId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('API Response:', data);
      setReviews(data.ratings); // Уверете се, че всяко ревю има movieId
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReviews();
  }, [movieId, user?.token]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!movieId) { // Използваме movieId от пропс, не от editingReview
      console.error('MovieId не е наличен при редактиране!');
      setError('Няма наличен MovieId!');
      return;
    }
    
    try {
      const response = await fetch(``${import.meta.env.VITE_API_BASE_URL || "${import.meta.env.VITE_API_BASE_URL || "https://movierec-backend-7jqo.onrender.com/api"}"}`/movieratings/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          movieId: Number(movieId),  // Това е ключово - използваме пропс movieId
          rating: Number(editForm.rating),
          review: editForm.review
        })
      });
  
      if (!response.ok) throw new Error('Грешка при актуализация');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };
  


  const handleDelete = async (reviewId) => {
  const result = await Swal.fire({
    title: 'Are u sure',
    text: "This action cannot be Reverted",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded',
      cancelButton: 'bg-gray-300 text-black hover:bg-gray-400 px-4 py-2 rounded ml-2',
    },
    buttonsStyling: false
  });

  if (!result.isConfirmed) return;

  if (!movieId) {
    console.error('Invalid movie ID');
    setError('Invalid movie ID');
    return;
  }

  try {
    const response = await fetch(``${import.meta.env.VITE_API_BASE_URL || "${import.meta.env.VITE_API_BASE_URL || "https://movierec-backend-7jqo.onrender.com/api"}"}`/movieratings/${movieId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error while deleting');
    }

    fetchReviews(); // Презарежда отзивите
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
};

  if (loading) return <div className="text-white py-4">LoadingReviews...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;
  if (reviews.length === 0) return <div className="text-gray-400 py-4">No Reviews Yet</div>;

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-2xl font-bold text-white">
        Users Reviews ({reviews.length})
      </h3>

      {reviews.map((review) => {
        console.log('Review MovieId:', review.movieId); // Постави лог за movieId

        const isOwner = user?.id && review.userId && user.id.toString() === review.userId.toString();

        return (
          <div key={`${review.userId}-${review.ratedOn}`} className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-yellow-400 font-bold text-lg mr-2">{review.rating}/5</span>
                <span className="text-gray-300 text-sm">{new Date(review.ratedOn).toLocaleDateString('bg-BG')}</span>
              </div>
              <span className="text-blue-300 font-medium">
                {review.userName || 'Анонимен потребител'}
              </span>
            </div>

            <p className="text-white text-lg mb-2">{review.review || "No comments added"}</p>

            {isOwner && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    // Това трябва да бъде зададено преди да влезете в редактирането
                    setEditingReview(review); // review съдържа movieId
                    setEditForm({
                      rating: review.rating,  
                      review: review.review
                    });
                    console.log('Editing review for movieId:', review.movieId); // Проверка
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Edit
                </button>

                <button
  onClick={() => handleDelete(movieId)} // Пращаме movieId от пропс
  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
>
  Delete
</button>
              </div>
            )}
          </div>
        );
      })}

      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Edit rating</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-white mb-2">Rating:</label>
                <select
                  value={editForm.rating}
                  onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">Review:</label>
                <textarea
                  value={editForm.review}
                  onChange={(e) => setEditForm({ ...editForm, review: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  rows="4"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
