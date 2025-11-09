/**
 * My Items Page
 * Display items you've created and manage borrow requests
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemsAPI, borrowAPI } from '../utils/api';
import ItemCard from '../components/ItemCard';
import CountdownTimer from '../components/CountdownTimer';

const MyItems = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [items, setItems] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/signin');
      return;
    }
    loadData();
  }, [session, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all items
      const itemsResponse = await itemsAPI.getAll();
      if (itemsResponse.success) {
        // Filter to show only my items
        const myItems = itemsResponse.data.filter(
          (item) => item.owner_id === session.user?.id
        );
        setItems(myItems);
      }

      // Load borrow requests
      const requestsResponse = await borrowAPI.getMine();
      if (requestsResponse.success) {
        setBorrowRequests(requestsResponse.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await borrowAPI.approve(requestId);
      if (response.success) {
        alert('Request approved!');
        loadData(); // Reload data
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
        loadData(); // Reload data
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Get requests for my items
  const getRequestsForItem = (itemId) => {
    return borrowRequests.filter(
      (req) => req.item_id === itemId && (req.status === 'pending' || req.status === 'approved')
    );
  };

  const handleMarkReturned = async (requestId) => {
    try {
      const response = await borrowAPI.markReturned(requestId);
      if (response.success) {
        alert('Item marked as returned! It is now available for borrowing again.');
        loadData(); // Reload data
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!session) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Items</h1>
        <button
          onClick={() => navigate('/items/new')}
          className="bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors shadow-md"
        >
          + Create New Item
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't created any items yet.</p>
          <button
            onClick={() => navigate('/items/new')}
            className="bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors shadow-md"
          >
            Create Your First Item
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {items.map((item) => {
            const requests = getRequestsForItem(item.id);
            return (
              <div key={item.id} className="border rounded-lg p-6">
                <ItemCard item={item} />
                
                {/* Borrow Requests for this item */}
                {requests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">
                      {requests.some(r => r.status === 'pending') ? 'Pending Requests:' : 'Active Borrows:'}
                    </h3>
                    <div className="space-y-2">
                      {requests.map((request) => {
                        // Calculate return deadline (end of end date)
                        const returnDeadline = request.borrow_end_date 
                          ? new Date(request.borrow_end_date + 'T23:59:59').toISOString()
                          : null;

                        return (
                          <div
                            key={request.id}
                            className="border rounded-lg p-4 bg-white shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">
                                  {request.status === 'approved' ? 'Borrowed by: ' : 'Request from: '}
                                  {request.borrower_name || request.borrower_email || request.borrower_id}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Start: {new Date(request.borrow_start_date).toLocaleDateString()} - 
                                  End: {new Date(request.borrow_end_date).toLocaleDateString()}
                                </p>
                                {request.status === 'approved' && (
                                  <p className="text-sm text-umass-maroon font-medium mt-2">
                                    Status: Currently Borrowed
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                {request.status === 'pending' ? (
                                  <>
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
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleMarkReturned(request.id)}
                                    className="bg-umass-maroon text-umass-cream px-4 py-2 rounded hover:bg-umass-maroonDark font-semibold transition-colors"
                                  >
                                    Mark as Returned
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Countdown Timer for Approved Requests */}
                            {request.status === 'approved' && returnDeadline && (
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyItems;

