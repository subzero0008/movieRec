import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pollService from '../services/pollService';
import { useAuth } from '../AuthContext';

const ActivePollsPage = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivePolls = async () => {
      try {
        if (!user || !user.token) {
          navigate('/login');
          return;
        }

        const activePolls = await pollService.getActivePolls();
        setPolls(activePolls);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data || err.message || 'Failed to fetch active polls');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActivePolls();
  }, [user, navigate]);

  const handleVote = async (pollId, movieId) => {
    try {
      if (!user?.token) {
        navigate('/login');
        return;
      }

      await pollService.vote(pollId, movieId);
      const updatedPolls = await pollService.getActivePolls();
      setPolls(updatedPolls);
      alert('Vote submitted successfully!');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert(err.response?.data || 'Failed to submit vote');
      }
    }
  };

  const handleEditPoll = (pollId) => {
    navigate(`/polls/edit/${pollId}`);
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        await pollService.deletePoll(pollId, user.token);
        setPolls(polls.filter(p => p.id !== pollId));
        alert('Poll deleted successfully!');
      } catch (err) {
        console.error('Error deleting poll:', err);
        alert('Failed to delete poll');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Error loading polls</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mr-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Active Polls
          </h1>
          <p className="text-gray-400 text-lg">
            Vote for your favorite movies
          </p>
        </div>

        {polls.length === 0 ? (
          <div className="text-center text-white py-12">
            <p className="text-xl">No active polls at the moment</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {polls.map((poll) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onVote={handleVote}
                onEdit={handleEditPoll}
                onDelete={handleDeletePoll}
                token={user?.token}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PollCard = ({ poll, onVote, onEdit, onDelete, token, currentUser }) => {
  const navigate = useNavigate();
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const checkVotedStatus = async () => {
      try {
        if (!token) return;
        const voteStatus = await pollService.checkVoteStatus(poll.id, token);
        setHasVoted(voteStatus.hasVoted);
      } catch (err) {
        console.error('Error checking vote status:', err);
        setHasVoted(false);
      }
    };

    checkVotedStatus();
  }, [poll.id, token]);

  const handleViewResults = async () => {
    try {
      if (!token) return;
      const pollResults = await pollService.getPollResults(poll.id, token);
      setResults(pollResults);
      setShowResults(true);
    } catch (err) {
      console.error('Error fetching results:', err);
      alert('Failed to load poll results');
    }
  };

  const handleHideResults = () => {
    setShowResults(false);
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  const canEditDelete = currentUser && 
    (currentUser.role === 'Admin' || 
     (currentUser.role === 'Cinema' && currentUser.id === poll.createdByUserId));

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4 flex items-center">
        <div className="mr-4">
          {/* ... икона ... */}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline">
            <h3 className="text-xl font-bold text-white mr-2">{poll.cinemaInfo?.name || 'Cinema'}</h3>
            {poll.cinemaInfo?.city && (
              <span className="text-yellow-100 text-sm font-medium bg-yellow-800 bg-opacity-50 px-2 py-1 rounded-full">
                {poll.cinemaInfo.city}
              </span>
            )}
          </div>
          <div className="flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-200 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-100 text-sm">Currently having {poll.movies.length} movies in this poll</p>
          </div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
      
      <div className="p-6">
        {canEditDelete && (
          <div className="flex justify-end space-x-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(poll.id);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(poll.id);
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Delete
            </button>
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{poll.title}</h2>
            <p className="text-gray-400 mt-2">{poll.description}</p>
            <div className="flex items-center mt-4 text-gray-300 text-sm">
              <span>
                Active from {new Date(poll.startDate).toLocaleDateString()} to{' '}
                {new Date(poll.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          {showResults ? (
            <button
              onClick={handleHideResults}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Hide Results
            </button>
          ) : (
            <button
              onClick={handleViewResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              View Results
            </button>
          )}
        </div>

        {showResults && results ? (
          <div className="mt-6 bg-gray-700 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Poll Results</h3>
            <div className="mb-4 flex items-center">
              <span className="text-yellow-400 font-bold mr-2">Total Votes:</span>
              <span className="text-white">{results.totalVotes}</span>
            </div>
            {results.results && results.results.length > 0 ? (
              <div className="space-y-4">
                {results.results.map((result) => (
                  <div 
                    key={result.movieId} 
                    className="flex items-center cursor-pointer hover:bg-gray-600 p-2 rounded"
                    onClick={() => handleMovieClick(result.movieId)}
                  >
                    <img
                      src={result.posterPath 
                        ? `https://image.tmdb.org/t/p/w200${result.posterPath}`
                        : 'https://via.placeholder.com/200x300?text=No+Poster'}
                      alt={result.title}
                      className="w-16 h-24 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
                      }}
                    />
                    <div className="ml-4 flex-grow">
                      <h4 className="text-lg font-medium text-white">{result.title}</h4>
                      <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                            width: `${results.totalVotes > 0 
                              ? (result.votes / results.totalVotes) * 100 
                              : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {result.votes} votes (
                        {results.totalVotes > 0 
                          ? Math.round((result.votes / results.totalVotes) * 100) 
                          : 0
                        }%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No votes yet</p>
            )}
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mt-6 mb-4">
              {hasVoted ? 'Your vote has been submitted!' : 'Select a movie to vote:'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {poll.movies.map((movie) => (
                <div
                  key={movie.tmdbMovieId}
                  className="relative group"
                >
                  <div
                    className={`bg-gray-700 rounded-lg overflow-hidden shadow-md transition-all cursor-pointer ${
                      selectedMovieId === movie.tmdbMovieId
                        ? 'ring-2 ring-yellow-500'
                        : ''
                    } group-hover:shadow-lg`}
                    onClick={() => handleMovieClick(movie.tmdbMovieId)}
                  >
                    <div className="relative pt-[150%] overflow-hidden">
                      <img
                        src={
                          movie.posterPath
                            ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                            : 'https://via.placeholder.com/500x750?text=No+Poster'
                        }
                        alt={movie.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/500x750?text=No+Poster';
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <h4 className="text-sm font-medium text-white truncate">
                        {movie.title}
                      </h4>
                    </div>
                  </div>
                  {!hasVoted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMovieId(movie.tmdbMovieId);
                      }}
                      className={`absolute top-2 right-2 p-1 rounded-full ${
                        selectedMovieId === movie.tmdbMovieId 
                          ? 'bg-yellow-500 text-gray-900' 
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!hasVoted && selectedMovieId && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => onVote(poll.id, selectedMovieId)}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded"
                >
                  Submit Vote
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivePollsPage;