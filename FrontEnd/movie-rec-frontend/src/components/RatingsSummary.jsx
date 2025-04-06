import { useEffect, useState } from 'react';

export default function RatingsSummary({ movieId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115/api'}/MovieRatings/movie/${movieId}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ratings: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRatings();
  }, [movieId]);

  if (loading) return <div className="text-white">Зареждане на рейтинги...</div>;

  if (!summary) {
    return <div className="text-white">Няма налични рейтинги за този филм.</div>;
  }

  return (
    <div className="mt-8 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-xl text-white mb-4">Рейтинги</h3>
      <div className="text-white">
        <p>Среден рейтинг: <span className="font-bold">{summary.averageRating.toFixed(1)}</span></p>
        <p>Общо рейтинги: <span className="font-bold">{summary.totalRatings}</span></p>
        
        <div className="mt-4">
          {Object.entries(summary.distribution).map(([stars, count]) => (
            <div key={stars} className="flex items-center mb-2">
              <span className="w-20">{stars} звезди:</span>
              <div className="flex-1 bg-gray-700 h-4 rounded-full">
                <div 
                  className="bg-yellow-500 h-4 rounded-full" 
                  style={{ width: `${(count / summary.totalRatings) * 100}%` }}
                />
              </div>
              <span className="ml-2 w-10">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
