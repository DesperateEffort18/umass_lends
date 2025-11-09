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
  const [duration, setDuration] = useState({
    months: 0,
    days: 0,
    hours: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Get today's date in local timezone (YYYY-MM-DD format)
  // This ensures users can select today's date regardless of their timezone
  const getTodayLocal = () => {
    const today = new Date();
    // Use local time methods to avoid UTC timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get the minimum selectable date (today in local timezone)
  const minDate = getTodayLocal();

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

  // Calculate end date from start date and duration
  const calculateEndDate = (startDate, months, days, hours) => {
    if (!startDate) return '';
    
    // Parse the start date as a local date (avoid UTC timezone issues)
    // Split the date string and create a date in local timezone
    const [year, month, day] = startDate.split('-').map(Number);
    // Create date at noon to avoid any DST or timezone edge cases
    const start = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Add duration in the correct order
    // Add months first (using a copy to avoid mutation issues)
    const endDate = new Date(start);
    
    if (months && months > 0) {
      endDate.setMonth(endDate.getMonth() + months);
    }
    
    // Then add days
    if (days && days > 0) {
      endDate.setDate(endDate.getDate() + days);
    }
    
    // Then add hours (this might push to next day, which is correct)
    if (hours && hours > 0) {
      endDate.setHours(endDate.getHours() + hours);
    }
    
    // Format as YYYY-MM-DD (date only for the API)
    // Use UTC methods to get the date components to avoid timezone shifts
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    
    const calculatedEndDate = `${endYear}-${endMonth}-${endDay}`;
    
    // Ensure end date is not before start date (safety check)
    // Compare as strings (YYYY-MM-DD format allows string comparison)
    if (calculatedEndDate < startDate) {
      // This should never happen with proper duration, but if it does, return start date
      console.warn('Calculated end date is before start date, using start date as end date');
      return startDate;
    }
    
    return calculatedEndDate;
  };

  // Update end date when start date or duration changes
  useEffect(() => {
    if (borrowDates.startDate) {
      const endDate = calculateEndDate(
        borrowDates.startDate,
        duration.months,
        duration.days,
        duration.hours
      );
      setBorrowDates(prev => ({ ...prev, endDate }));
    }
  }, [borrowDates.startDate, duration.months, duration.days, duration.hours]);

  // Handle borrow request
  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in to request to borrow');
      navigate('/signin');
      return;
    }

    if (!borrowDates.startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate that end date is not before start date
    if (borrowDates.endDate && borrowDates.endDate < borrowDates.startDate) {
      alert('Return deadline cannot be before the start date. Please adjust the duration.');
      return;
    }

    // Allow same-day requests (all duration fields can be 0, end date will equal start date)
    // But if user explicitly set duration to 0, that's also fine - it means same-day return

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
        setDuration({ months: 0, days: 0, hours: 0 });
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
                    <label className="block mb-2 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={borrowDates.startDate}
                      onChange={(e) => {
                        setBorrowDates({ ...borrowDates, startDate: e.target.value });
                      }}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      min={minDate} // Allow today (local time) and future dates
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-medium">Borrow Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Months</label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={duration.months}
                          onChange={(e) => setDuration({ ...duration, months: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Days</label>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={duration.days}
                          onChange={(e) => setDuration({ ...duration, days: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={duration.hours}
                          onChange={(e) => setDuration({ ...duration, hours: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {(duration.months > 0 || duration.days > 0 || duration.hours > 0) && (
                      <p className="text-sm text-gray-600 mt-2">
                        Duration: {duration.months > 0 && `${duration.months} month${duration.months !== 1 ? 's' : ''} `}
                        {duration.days > 0 && `${duration.days} day${duration.days !== 1 ? 's' : ''} `}
                        {duration.hours > 0 && `${duration.hours} hour${duration.hours !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>

                  {borrowDates.endDate && (
                    <div className={`border rounded-lg p-3 ${
                      borrowDates.endDate < borrowDates.startDate 
                        ? 'bg-red-50 border-red-200' 
                        : borrowDates.endDate === borrowDates.startDate
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-700 mb-1">Return Deadline:</p>
                      <p className="text-lg font-bold text-umass-maroon">
                        {new Date(borrowDates.endDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {borrowDates.endDate < borrowDates.startDate && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          ⚠️ Warning: Return deadline is before start date!
                        </p>
                      )}
                      {borrowDates.endDate === borrowDates.startDate && (
                        <p className="text-sm text-yellow-700 mt-2">
                          Same-day return requested
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || (borrowDates.endDate && borrowDates.endDate < borrowDates.startDate)}
                      className="flex-1 bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark disabled:opacity-50 font-semibold transition-colors shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBorrowForm(false);
                        setBorrowDates({ startDate: '', endDate: '' });
                        setDuration({ months: 0, days: 0, hours: 0 });
                      }}
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

