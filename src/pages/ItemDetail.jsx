/**
 * Item Detail Page
 * Shows full item details, allows borrowing, and messaging
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemsAPI, borrowAPI, messagesAPI, collateralAPI, reportsAPI } from '../utils/api';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import CollateralModal from '../components/CollateralModal';
import UserInfoModal from '../components/UserInfoModal';
import ReportModal from '../components/ReportModal';
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
    minutes: 0,
  });
  const [startTime, setStartTime] = useState(''); // Start time (HH:MM) - required
  const [exactReturnDateTime, setExactReturnDateTime] = useState(null); // Store exact return datetime
  const [submitting, setSubmitting] = useState(false);
  const [messageText, setMessageText] = useState('');
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  // Collateral recommendations
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [collateralRecommendations, setCollateralRecommendations] = useState(null);
  const [loadingCollateral, setLoadingCollateral] = useState(false);
  
  // User info modal
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  
  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);

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

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get minimum time based on selected start date
  // If today is selected, min time is current time (rounded up to next minute)
  // If future date is selected, min time is 00:00
  const getMinTime = () => {
    if (!borrowDates.startDate) {
      return '00:00';
    }
    
    const today = getTodayLocal();
    if (borrowDates.startDate === today) {
      // For today, minimum time is current time + 1 minute (to avoid selecting past times)
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const currentHours = now.getHours();
      
      // Round up to next minute
      let minMinutes = currentMinutes + 1;
      let minHours = currentHours;
      
      if (minMinutes >= 60) {
        minMinutes = 0;
        minHours += 1;
        if (minHours >= 24) {
          minHours = 0;
        }
      }
      
      return `${String(minHours).padStart(2, '0')}:${String(minMinutes).padStart(2, '0')}`;
    }
    
    // For future dates, any time is allowed
    return '00:00';
  };

  // Get the minimum selectable date (today in local timezone)
  const minDate = getTodayLocal();
  const minTime = getMinTime();

  // Load item details
  useEffect(() => {
    loadItem();
  }, [id]);

  // Calculate isOwner and isAvailable (must be defined before useEffect that uses them)
  const isOwner = session && item && session.user?.id === item.owner_id;
  const isAvailable = item?.available;

  // Load collateral recommendations when borrow form is shown
  useEffect(() => {
    if (showBorrowForm && item && !isOwner) {
      loadCollateralRecommendations();
    }
  }, [showBorrowForm, item, isOwner]);

  const loadCollateralRecommendations = async () => {
    if (!item) return;
    
    try {
      setLoadingCollateral(true);
      const response = await collateralAPI.getRecommendations(item.id, 5);
      if (response.success && response.data) {
        setCollateralRecommendations(response.data);
      }
    } catch (err) {
      console.error('Error loading collateral recommendations:', err);
      // Don't show error to user, just don't show recommendations
    } finally {
      setLoadingCollateral(false);
    }
  };

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

  // Calculate exact return datetime from start date, start time, and duration
  const calculateExactReturnDateTime = (startDate, startTime, months, days, hours, minutes) => {
    if (!startDate || !startTime) return { endDate: '', exactDateTime: null };
    
    // Parse start date and start time
    const [year, month, day] = startDate.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    // Create start datetime in local timezone
    const startDateTime = new Date(year, month - 1, day, startHour || 0, startMinute || 0, 0, 0);
    
    // Calculate exact return datetime by adding duration
    const returnDateTime = new Date(startDateTime);
    
    // Add duration in order: months, days, hours, minutes
    // Always add hours and minutes (even if 0) to ensure exact time calculation
    if (months > 0) {
      returnDateTime.setMonth(returnDateTime.getMonth() + months);
    }
    if (days > 0) {
      returnDateTime.setDate(returnDateTime.getDate() + days);
    }
    // Always add hours and minutes to get exact time (no rounding)
    returnDateTime.setHours(returnDateTime.getHours() + hours);
    returnDateTime.setMinutes(returnDateTime.getMinutes() + minutes);
    
    // Format end date as YYYY-MM-DD for API
    const endYear = returnDateTime.getFullYear();
    const endMonth = String(returnDateTime.getMonth() + 1).padStart(2, '0');
    const endDay = String(returnDateTime.getDate()).padStart(2, '0');
    const calculatedEndDate = `${endYear}-${endMonth}-${endDay}`;
    
    // Format datetime as ISO string but keep it in local timezone context
    // We need to format it manually to avoid timezone conversion issues
    // Format: YYYY-MM-DDTHH:mm:ss (without Z, so it's treated as local time)
    const endHour = String(returnDateTime.getHours()).padStart(2, '0');
    const endMinute = String(returnDateTime.getMinutes()).padStart(2, '0');
    const endSecond = String(returnDateTime.getSeconds()).padStart(2, '0');
    const exactDateTimeISO = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}:${endSecond}`;
    
    // Ensure end date is not before start date
    if (calculatedEndDate < startDate) {
      console.warn('Calculated end date is before start date, using start date as end date');
      const startYear = startDateTime.getFullYear();
      const startMonth = String(startDateTime.getMonth() + 1).padStart(2, '0');
      const startDay = String(startDateTime.getDate()).padStart(2, '0');
      const startHourStr = String(startDateTime.getHours()).padStart(2, '0');
      const startMinuteStr = String(startDateTime.getMinutes()).padStart(2, '0');
      const startSecondStr = String(startDateTime.getSeconds()).padStart(2, '0');
      return { 
        endDate: startDate, 
        exactDateTime: `${startYear}-${startMonth}-${startDay}T${startHourStr}:${startMinuteStr}:${startSecondStr}`
      };
    }
    
    return { endDate: calculatedEndDate, exactDateTime: exactDateTimeISO };
  };

  // Update end date and exact return datetime when start date, time, or duration changes
  useEffect(() => {
    if (borrowDates.startDate && startTime) {
      const { endDate, exactDateTime } = calculateExactReturnDateTime(
        borrowDates.startDate,
        startTime,
        duration.months,
        duration.days,
        duration.hours,
        duration.minutes
      );
      setBorrowDates(prev => ({ ...prev, endDate }));
      setExactReturnDateTime(exactDateTime);
    }
  }, [borrowDates.startDate, startTime, duration.months, duration.days, duration.hours, duration.minutes]);

  // When start date changes, update start time if needed
  useEffect(() => {
    if (borrowDates.startDate) {
      const newMinTime = getMinTime();
      const today = getTodayLocal();
      
      // If today is selected and current time is before selected time, update it
      if (borrowDates.startDate === today) {
        if (!startTime || startTime < newMinTime) {
          setStartTime(newMinTime);
        }
      } else if (!startTime) {
        // For future dates, default to 00:00 if not set
        setStartTime('00:00');
      }
    }
  }, [borrowDates.startDate]);

  // Handle borrow request
  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    if (!session) {
      showWarning('Please sign in to request to borrow');
      navigate('/signin');
      return;
    }

    if (!borrowDates.startDate) {
      showWarning('Please select a start date');
      return;
    }

    if (!startTime) {
      showWarning('Please select a start time');
      return;
    }

    // Validate that the selected time is not in the past if today is selected
    const today = getTodayLocal();
    if (borrowDates.startDate === today) {
      const selectedTime = startTime.split(':').map(Number);
      const currentTime = getCurrentTime().split(':').map(Number);
      const selectedMinutes = selectedTime[0] * 60 + selectedTime[1];
      const currentMinutes = currentTime[0] * 60 + currentTime[1];
      
      if (selectedMinutes < currentMinutes) {
        showError('Start time cannot be in the past. Please select a future time.');
        return;
      }
    }

    // Validate that end date is not before start date
    if (borrowDates.endDate && borrowDates.endDate < borrowDates.startDate) {
      showError('Return deadline cannot be before the start date. Please adjust the duration.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await borrowAPI.submit(
        id,
        borrowDates.startDate,
        borrowDates.endDate,
        {
          startTime: startTime, // Required now
          hours: duration.hours || 0,
          minutes: duration.minutes || 0,
          exactReturnDateTime: exactReturnDateTime || null,
        }
      );
      
      if (response.success) {
        showSuccess('Borrow request submitted successfully!');
        setShowBorrowForm(false);
        setBorrowDates({ startDate: '', endDate: '' });
        setDuration({ months: 0, days: 0, hours: 0, minutes: 0 });
        setStartTime('');
        setExactReturnDateTime(null);
      } else {
        showError(`Error: ${response.error}`);
      }
    } catch (err) {
      showError(`Error: ${err.message || 'Failed to submit borrow request'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!session) {
      showWarning('Please sign in to send a message');
      return;
    }

    if (!messageText.trim()) {
      return;
    }

    try {
      await messagesAPI.send(id, messageText);
      setMessageText('');
      // Message sent successfully - no need to show notification for every message
    } catch (err) {
      showError(`Error sending message: ${err.message || 'Failed to send message'}`);
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
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error || 'Item not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
      
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
          
          {/* Owner Information */}
          {item.owner_name && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Uploaded by:</p>
              <button
                onClick={() => {
                  if (item.owner_id) {
                    setShowUserInfoModal(true);
                  }
                }}
                className="text-umass-maroon hover:text-umass-maroonDark font-semibold underline transition-colors"
              >
                {item.owner_name}
              </button>
            </div>
          )}

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
            {item.location && (
              <div>
                <span className="font-semibold">📍 Location:</span> {item.location}
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
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBorrowForm(true)}
                    className="w-full bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors shadow-md"
                  >
                    Request to Borrow
                  </button>
                  {/* Report Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                    >
                      🚨 Report Item
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBorrowRequest} className="space-y-4">
                  {/* Payment Apps Recommendation */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💳</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Liability Protection Recommendation
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">
                          We recommend using <strong>Venmo</strong>, <strong>Zelle</strong>, or <strong>CashApp</strong> for a security deposit if you're comfortable with that option. 
                          This provides protection for the lender while keeping the process simple.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCollateralModal(true)}
                          className="text-sm text-umass-maroon hover:text-umass-maroonDark font-semibold underline mb-2"
                        >
                          🤖 Or view AI-recommended collateral items →
                        </button>
                        <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-sm text-yellow-800 font-semibold">
                            ⚠️ Important: Be sure to come up with a valid collateral agreement with the lender before obtaining the item. 
                            Discuss and agree on the collateral method (payment app deposit or physical item) before picking up the item.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Start Date *</label>
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
                    <label className="block mb-2 font-medium">Start Time *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      min={getMinTime()}
                      key={borrowDates.startDate} // Force re-render when date changes to update min
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {borrowDates.startDate === getTodayLocal() 
                        ? `Earliest time: ${getMinTime()} (cannot select past times)`
                        : 'Select the time you want to start borrowing'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-medium">Borrow Duration</label>
                    <div className="grid grid-cols-4 gap-2">
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
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={duration.minutes}
                          onChange={(e) => setDuration({ ...duration, minutes: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {(duration.months > 0 || duration.days > 0 || duration.hours > 0 || duration.minutes > 0) && (
                      <p className="text-sm text-gray-600 mt-2">
                        Duration: {duration.months > 0 && `${duration.months} month${duration.months !== 1 ? 's' : ''} `}
                        {duration.days > 0 && `${duration.days} day${duration.days !== 1 ? 's' : ''} `}
                        {duration.hours > 0 && `${duration.hours} hour${duration.hours !== 1 ? 's' : ''} `}
                        {duration.minutes > 0 && `${duration.minutes} minute${duration.minutes !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>

                      {exactReturnDateTime && startTime && (
                        <div className={`border rounded-lg p-3 ${
                          borrowDates.endDate < borrowDates.startDate 
                            ? 'bg-red-50 border-red-200' 
                            : borrowDates.endDate === borrowDates.startDate
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <p className="text-sm font-medium text-gray-700 mb-1">Exact Return Deadline:</p>
                          <p className="text-lg font-bold text-umass-maroon">
                            {(() => {
                              // Parse exactReturnDateTime as local time to avoid timezone issues
                              let displayDate;
                              if (exactReturnDateTime.includes('Z') || exactReturnDateTime.match(/[+-]\d{2}:\d{2}$/)) {
                                displayDate = new Date(exactReturnDateTime);
                              } else {
                                // Parse as local time string
                                const match = exactReturnDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
                                if (match) {
                                  const [, year, month, day, hour, minute, second] = match;
                                  displayDate = new Date(
                                    parseInt(year),
                                    parseInt(month) - 1,
                                    parseInt(day),
                                    parseInt(hour),
                                    parseInt(minute),
                                    parseInt(second || 0)
                                  );
                                } else {
                                  displayDate = new Date(exactReturnDateTime);
                                }
                              }
                              return displayDate.toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              });
                            })()}
                          </p>
                          {borrowDates.endDate < borrowDates.startDate && (
                            <p className="text-sm text-red-600 mt-2 font-medium">
                              ⚠️ Warning: Return deadline is before start date!
                            </p>
                          )}
                          {borrowDates.endDate === borrowDates.startDate && (duration.months === 0 && duration.days === 0) && (
                            <p className="text-sm text-yellow-700 mt-2">
                              Same-day return requested
                            </p>
                          )}
                        </div>
                      )}
                      {!startTime && borrowDates.startDate && (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-700">
                            Please select a start time to see the return deadline
                          </p>
                        </div>
                      )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !startTime || (borrowDates.endDate && borrowDates.endDate < borrowDates.startDate)}
                      className="flex-1 bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark disabled:opacity-50 font-semibold transition-colors shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                        onClick={() => {
                          setShowBorrowForm(false);
                          setBorrowDates({ startDate: '', endDate: '' });
                          setDuration({ months: 0, days: 0, hours: 0, minutes: 0 });
                          setStartTime('');
                          setExactReturnDateTime(null);
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

          {/* Report Button (when item is unavailable or user is not signed in) */}
          {!isOwner && session && !isAvailable && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => setShowReportModal(true)}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
              >
                🚨 Report Item
              </button>
            </div>
          )}
        </div>

        {/* Collateral Recommendations Modal */}
        <CollateralModal
          isOpen={showCollateralModal}
          onClose={() => setShowCollateralModal(false)}
          recommendations={collateralRecommendations}
          loading={loadingCollateral}
          item={item}
        />

        {/* User Info Modal */}
        {item?.owner_id && (
          <UserInfoModal
            isOpen={showUserInfoModal}
            onClose={() => setShowUserInfoModal(false)}
            userId={item.owner_id}
          />
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemId={item?.id}
          itemTitle={item?.title}
          onReport={async (itemId, reason) => {
            try {
              const response = await reportsAPI.report(itemId, reason);
              if (response.success) {
                showSuccess('Report submitted successfully! Thank you for helping keep our community safe.');
                if (response.data?.auto_removed) {
                  showWarning('This item has been automatically removed due to multiple reports.');
                  // Reload item to reflect removal
                  await loadItem();
                }
              } else {
                showError(response.error || 'Failed to submit report');
              }
              return response;
            } catch (err) {
              showError(err.message || 'Failed to submit report');
              return { success: false, error: err.message };
            }
          }}
        />

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

