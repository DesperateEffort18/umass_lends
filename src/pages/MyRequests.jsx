/**
 * My Requests Page
 * Shows user's item requests
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemRequestsAPI } from '../utils/api';

const MyRequests = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/signin');
      return;
    }
    loadRequests();
  }, [session, navigate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await itemRequestsAPI.get({ mine: true });
      if (response.success) {
        setRequests(response.data || []);
      } else {
        setError(response.error || 'Failed to load requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-green-100 text-green-800 border-green-300',
      accepted: 'bg-blue-100 text-blue-800 border-blue-300',
      fulfilled: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return badges[status] || badges.open;
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      accepted: 'Accepted',
      fulfilled: 'Fulfilled',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Requests</h1>
        <p className="text-center">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Requests</h1>
        <Link
          to="/requests/new"
          className="bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors shadow-md"
        >
          + New Request
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">You haven't created any requests yet.</p>
          <Link
            to="/requests/new"
            className="inline-block bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
          >
            Create Your First Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{request.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusBadge(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              {request.description && (
                <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>
              )}

              {request.category && (
                <span className="inline-block mb-3 px-2 py-1 bg-umass-maroon text-umass-cream text-xs rounded">
                  {request.category}
                </span>
              )}

              <div className="text-sm text-gray-500 mb-3">
                Created: {new Date(request.created_at).toLocaleDateString()}
              </div>

              {request.status === 'accepted' && request.created_item_id && (
                <Link
                  to={`/items/${request.created_item_id}`}
                  className="block w-full bg-umass-maroon text-umass-cream px-4 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold text-center transition-colors mt-3"
                >
                  View Item →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;

