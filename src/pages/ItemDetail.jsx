/**
 * Item Detail Page
 * Shows full item details, allows borrowing, and messaging
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemsAPI, borrowAPI, messagesAPI } from '../utils/api';
// Note: You'll need to implement useRealtimeMessages hook or use the example
// For now, we'll use a simpler approach with polling

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowDates, setBorrowDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Load item details
  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getById(id);
      if (response.success) {
        setItem(response.data);
      } else {
        setError(response.error || 'Item not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  // Handle borrow request
  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in to request to borrow');
      navigate('/signin');
      return;
    }

    try {
      setSubmitting(true);
      const response = await borrowAPI.submit(
        id,
        borrowDates.startDate,
        borrowDates.endDate
      );
      
      if (response.success) {
        alert('Borrow request submitted successfully!');
        setShowBorrowForm(false);
        setBorrowDates({ startDate: '', endDate: '' });
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in to send a message');
      return;
    }

    if (!messageText.trim()) {
      return;
    }

    try {
      await messagesAPI.send(id, messageText);
      setMessageText('');
    } catch (err) {
      alert(`Error sending message: ${err.message}`);
    }
  };

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  // Load messages
  useEffect(() => {
    loadMessages();
    // Poll for new messages every 2 seconds (or use realtime)
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const loadMessages = async () => {
    try {
      const response = await messagesAPI.getByItem(id);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const isOwner = session && item && session.user?.id === item.owner_id;
  const isAvailable = item?.available;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error || 'Item not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="mb-4 text-umass-maroon hover:text-umass-maroonDark font-medium transition-colors"
              >
                ← Back
              </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Item Details */}
        <div>
          {/* Item Image */}
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Item Info */}
          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          <p className="text-gray-700 mb-4">{item.description}</p>

          <div className="space-y-2 mb-6">
            {item.category && (
              <div>
                <span className="font-semibold">Category:</span> {item.category}
              </div>
            )}
            {item.condition && (
              <div>
                <span className="font-semibold">Condition:</span> {item.condition}
              </div>
            )}
            <div>
              <span className="font-semibold">Status:</span>{' '}
              {item.available ? (
                <span className="text-green-600 font-semibold">Available</span>
              ) : (
                <span className="text-red-600 font-semibold">Unavailable</span>
              )}
            </div>
          </div>

          {/* Borrow Request Button */}
          {!isOwner && isAvailable && session && (
            <div className="mb-6">
              {!showBorrowForm ? (
                <button
                  onClick={() => setShowBorrowForm(true)}
                  className="w-full bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors shadow-md"
                >
                  Request to Borrow
                </button>
              ) : (
                <form onSubmit={handleBorrowRequest} className="space-y-4">
                  <div>
                    <label className="block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={borrowDates.startDate}
                      onChange={(e) =>
                        setBorrowDates({ ...borrowDates, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">End Date</label>
                    <input
                      type="date"
                      value={borrowDates.endDate}
                      onChange={(e) =>
                        setBorrowDates({ ...borrowDates, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark disabled:opacity-50 font-semibold transition-colors shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBorrowForm(false)}
                      className="px-6 py-3 border rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!session && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              Please sign in to request to borrow this item.
            </div>
          )}
        </div>

        {/* Right Column - Messages */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Messages</h2>

          {/* Messages List */}
          <div className="border rounded-lg p-4 mb-4 h-64 overflow-y-auto">
            {messagesLoading ? (
              <p>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-500">No messages yet.</p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded ${
                      message.sender_id === session?.user?.id
                        ? 'bg-umass-maroon text-umass-cream ml-8'
                        : 'bg-umass-lightGray text-umass-gray mr-8'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {message.sender_id === session?.user?.id 
                        ? 'You' 
                        : (message.sender_name || message.sender_email || 'Unknown User')}
                    </p>
                    <p>{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Message Form */}
          {session ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Please sign in to send a message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;

