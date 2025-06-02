import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pollService from '../services/pollService';
import { useAuth } from '../AuthContext';

const EditPollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await pollService.getPollDetails(id);
        setPoll(pollData);
      } catch (err) {
        setError(err.response?.data || err.message || 'Failed to fetch poll');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pollService.updatePoll(id, poll);
      navigate('/polls/active');
      alert('Poll updated successfully!');
    } catch (err) {
      setError(err.response?.data || 'Failed to update poll');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => navigate('/polls')}>Back to Polls</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Edit Poll</h1>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={poll.title || ''}
              onChange={(e) => setPoll({...poll, title: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={poll.description || ''}
              onChange={(e) => setPoll({...poll, description: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded"
              rows="3"
            />
          </div>

          {/* Добавете полета за дати и филми според нуждите */}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/polls')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPollPage;