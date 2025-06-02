import { useState, useEffect } from 'react';
import { TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import AdminService from '../services/adminService';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const reviewsData = await AdminService.fetchAllReviews();
        setReviews(reviewsData);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to load reviews. Please try again later.';
        setError(errorMessage);
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getSortedReviews = () => {
    const sorted = [...reviews];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.ratedOn) - new Date(a.ratedOn));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.ratedOn) - new Date(b.ratedOn));
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  };

  const handleDelete = async (reviewId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded',
        cancelButton: 'bg-gray-300 text-black hover:bg-gray-400 px-4 py-2 rounded ml-2',
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    try {
      await AdminService.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setSuccess('Review deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete review. Please try again.';
      setError(errorMessage);
      console.error('Error deleting review:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<SolidStarIcon key={i} className="h-5 w-5 text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<SolidStarIcon key={i} className="h-5 w-5 text-yellow-500 opacity-50" />);
      } else {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-500" />);
      }
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">
          Movie Reviews
        </h1>
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-gray-300">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-gray-700 text-white border-gray-600 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r" role="alert">
          <p className="font-bold">Success</p>
          <p>{success}</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg shadow p-6">
          <h3 className="mt-2 text-lg font-medium text-white">No reviews found</h3>
          <p className="mt-1 text-sm text-gray-400">
            There are currently no reviews in the system.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {getSortedReviews().map(review => (
            <div 
              key={review.id} 
              className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {review.movieTitle || `Movie ID: ${review.movieId}`}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Reviewed by <span className="font-medium">{review.userName || 'Anonymous'}</span>
                  </p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex mr-2">
                      {renderRatingStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {review.rating.toFixed(1)}/5
                    </span>
                  </div>
                  
                  {review.review && (
                    <div className="prose prose-sm max-w-none text-gray-300">
                      <p className="whitespace-pre-line">{review.review}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-400 mb-2">
                    {formatDate(review.ratedOn)}
                  </span>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors bg-gray-700 rounded-lg"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;