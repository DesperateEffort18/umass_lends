/**
 * Borrow Requests Page
 * View and manage borrow requests
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { borrowAPI, itemsAPI } from '../utils/api';
import CountdownTimer from '../components/CountdownTimer';

const BorrowRequests = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/signin');
      return;
    }
    loadRequests();
  }, [session, navigate, filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await borrowAPI.getMine(filterStatus || null);
      
      if (response.success) {
        setRequests(response.data || []);
        
        // Load item details for each request
        const itemIds = [...new Set(response.data.map((req) => req.item_id))];
        const itemsMap = {};
        
        for (const itemId of itemIds) {
          try {
            const itemResponse = await itemsAPI.getById(itemId);
            if (itemResponse.success) {
              itemsMap[itemId] = itemResponse.data;
            }
          } catch (err) {
            console.error(`Error loading item ${itemId}:`, err);
          }
        }
        
        setItems(itemsMap);
      } else {
        setError(response.error || 'Failed to load requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await borrowAPI.approve(requestId);
      if (response.success) {
        alert('Request approved!');
        loadRequests();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await borrowAPI.reject(requestId);
      if (response.success) {
        alert('Request rejected');
        loadRequests();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-umass-maroon text-umass-cream';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading requests...</p>
      </div>
    );
  }

  // Separate requests by role
  const myRequestsAsBorrower = requests.filter(
    (req) => req.borrower_id === session.user?.id
  );
  const myRequestsAsOwner = requests.filter(
    (req) => req.owner_id === session.user?.id
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Borrow Requests</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Requests I Made (as borrower) */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Borrow Requests</h2>
        {myRequestsAsBorrower.length === 0 ? (
          <p className="text-gray-600">You haven't made any borrow requests.</p>
        ) : (
          <div className="space-y-4">
            {myRequestsAsBorrower.map((request) => {
              const item = items[request.item_id];
              const returnDeadline = request.borrow_end_date && request.status === 'approved'
                ? new Date(request.borrow_end_date + 'T23:59:59').toISOString()
                : null;

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        to={`/items/${request.item_id}`}
                        className="text-umass-maroon hover:text-umass-maroonDark font-semibold text-lg transition-colors"
                      >
                        {item?.title || 'Loading...'}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        Owner: {request.owner_name || request.owner_email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(request.borrow_start_date).toLocaleDateString()} - 
                        End: {new Date(request.borrow_end_date).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm mt-2 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Countdown Timer for Approved Requests */}
                  {returnDeadline && (
                    <div className="mt-3">
                      <CountdownTimer 
                        endDate={returnDeadline}
                        label="Time until return deadline"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requests for My Items (as owner) */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Requests for My Items</h2>
        {myRequestsAsOwner.length === 0 ? (
          <p className="text-gray-600">
            No one has requested to borrow your items.
          </p>
        ) : (
          <div className="space-y-4">
            {myRequestsAsOwner.map((request) => {
              const item = items[request.item_id];
              const isOwner = request.owner_id === session.user?.id;
              const returnDeadline = request.borrow_end_date && request.status === 'approved'
                ? new Date(request.borrow_end_date + 'T23:59:59').toISOString()
                : null;

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        to={`/items/${request.item_id}`}
                        className="text-umass-maroon hover:text-umass-maroonDark font-semibold text-lg transition-colors"
                      >
                        {item?.title || 'Loading...'}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        Requested by: {request.borrower_name || request.borrower_email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(request.borrow_start_date).toLocaleDateString()} - 
                        End: {new Date(request.borrow_end_date).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm mt-2 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    {isOwner && request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 text-umass-cream px-4 py-2 rounded hover:bg-green-700 font-semibold transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-600 text-umass-cream px-4 py-2 rounded hover:bg-red-700 font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Countdown Timer for Approved Requests */}
                  {returnDeadline && (
                    <div className="mt-3">
                      <CountdownTimer 
                        endDate={returnDeadline}
                        label="Time until return deadline"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowRequests;

