/**
 * Borrow Requests Page
 * View and manage borrow requests
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { borrowAPI, itemsAPI } from '../utils/api';
import { supabase } from '../supabaseClient';
import CountdownTimer from '../components/CountdownTimer';
import { calculateExactReturnDeadline, formatDateOnlyEST, formatDateTimeEST } from '../utils/dateUtils';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import ConfirmModal from '../components/ConfirmModal';

const BorrowRequests = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null, itemTitle: '' });

  useEffect(() => {
    const loadRequestsIfAuthenticated = async () => {
      // If session is undefined, it's still loading - wait
      if (session === undefined) {
        return;
      }
      
      // If session is null, user is not authenticated
      if (!session) {
        navigate('/signin');
        return;
      }
      
      // Session exists, load requests
      loadRequests();
    };
    
    loadRequestsIfAuthenticated();
  }, [session, navigate, filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to refresh the session first if needed
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.expires_at && currentSession.expires_at * 1000 < Date.now()) {
          console.log('[BorrowRequests] Token expired, refreshing...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[BorrowRequests] Failed to refresh session:', refreshError);
          }
        }
      } catch (refreshErr) {
        console.error('[BorrowRequests] Error refreshing session:', refreshErr);
      }
      
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
        showSuccess('Request approved!');
        loadRequests();
      } else {
        showError(`Error: ${response.error}`);
      }
    } catch (err) {
      showError(`Error: ${err.message || 'Failed to approve request'}`);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await borrowAPI.reject(requestId);
      if (response.success) {
        showSuccess('Request rejected');
        loadRequests();
      } else {
        showError(`Error: ${response.error}`);
      }
    } catch (err) {
      showError(`Error: ${err.message || 'Failed to reject request'}`);
    }
  };

  const handleCancel = (requestId, itemTitle) => {
    setCancelModal({
      isOpen: true,
      requestId,
      itemTitle,
    });
  };

  const confirmCancel = async () => {
    const { requestId } = cancelModal;
    try {
      const response = await borrowAPI.cancel(requestId);
      if (response.success) {
        showSuccess('Request cancelled successfully');
        loadRequests();
      } else {
        showError(`Error: ${response.error}`);
      }
    } catch (err) {
      showError(`Error: ${err.message || 'Failed to cancel request'}`);
    }
  };

  const handleMarkPickedUp = async (requestId) => {
    try {
      const response = await borrowAPI.markPickedUp(requestId);
      if (response.success) {
        showSuccess('Item marked as picked up! Countdown timer started.');
        loadRequests();
      } else {
        showError(`Error: ${response.error}`);
      }
    } catch (err) {
      showError(`Error: ${err.message || 'Failed to mark item as picked up'}`);
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
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />

      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, requestId: null, itemTitle: '' })}
        onConfirm={confirmCancel}
        title="Cancel Borrow Request"
        message={`Are you sure you want to cancel your borrow request for "${cancelModal.itemTitle}"?\n\nThis action cannot be undone.`}
        confirmText="Cancel Request"
        cancelText="Keep Request"
        type="warning"
      />
      
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
              // Calculate exact return deadline (only show countdown if item was picked up)
              const returnDeadline = request.status === 'approved' && request.picked_up_at
                ? calculateExactReturnDeadline(request)
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
                        Start: {formatDateOnlyEST(request.borrow_start_date)} - 
                        End: {formatDateOnlyEST(request.borrow_end_date)}
                      </p>
                      {request.status === 'approved' && !request.picked_up_at && (
                        <p className="text-sm text-orange-600 mt-1 font-medium">
                          ⏳ Waiting for item to be picked up
                        </p>
                      )}
                      {request.status === 'approved' && request.picked_up_at && (
                        <p className="text-sm text-green-600 mt-1">
                          ✅ Picked up: {formatDateTimeEST(request.picked_up_at)}
                        </p>
                      )}
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm mt-2 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleCancel(request.id, item?.title || 'this item')}
                          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-semibold transition-colors"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Countdown Timer - Only show if item was picked up */}
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
              // Calculate exact return deadline (only show countdown if item was picked up)
              const returnDeadline = request.status === 'approved' && request.picked_up_at
                ? calculateExactReturnDeadline(request)
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
                        Start: {formatDateOnlyEST(request.borrow_start_date)} - 
                        End: {formatDateOnlyEST(request.borrow_end_date)}
                      </p>
                      {request.status === 'approved' && !request.picked_up_at && (
                        <p className="text-sm text-orange-600 mt-1 font-medium">
                          ⏳ Item not picked up yet - click "Picked Up" when borrower collects the item
                        </p>
                      )}
                      {request.status === 'approved' && request.picked_up_at && (
                        <p className="text-sm text-green-600 mt-1">
                          ✅ Picked up: {formatDateTimeEST(request.picked_up_at)}
                        </p>
                      )}
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
                    {isOwner && request.status === 'approved' && !request.picked_up_at && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleMarkPickedUp(request.id)}
                          className="bg-umass-maroon text-umass-cream px-4 py-2 rounded hover:bg-umass-maroonDark font-semibold transition-colors"
                        >
                          Picked Up
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Countdown Timer - Only show if item was picked up */}
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

