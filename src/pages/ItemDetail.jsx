/**
 * Item Detail Page
 * Shows full item details, allows borrowing, and messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemsAPI, borrowAPI, messagesAPI, collateralAPI, reportsAPI } from '../utils/api';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import CollateralModal from '../components/CollateralModal';
import UserInfoModal from '../components/UserInfoModal';
import ReportModal from '../components/ReportModal';
import { formatTimeEST, formatDateOnlyEST, formatDateTimeEST } from '../utils/dateUtils';
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

  // Load current user's profile picture and owner's profile picture
  useEffect(() => {
    const loadUserProfiles = async () => {
      // Support both Vite and Next.js environments
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
        || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) 
        || (typeof process !== 'undefined' && process.env?.VITE_API_URL)
        || 'http://localhost:3000';
      
      if (session?.user?.id) {
        try {
          // Load current user's profile picture
          const userResponse = await fetch(`${apiBase}/api/users/${session.user.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.data?.profile_picture_url) {
              setCurrentUserProfilePic(userData.data.profile_picture_url);
            }
          }
        } catch (error) {
          console.log('Could not load user profile picture:', error);
        }
      }
      
      // Load owner's profile picture if item is loaded and user is not the owner
      if (item?.owner_id && session?.user?.id !== item.owner_id) {
        try {
          const ownerResponse = await fetch(`${apiBase}/api/users/${item.owner_id}`);
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json();
            if (ownerData.success && ownerData.data?.profile_picture_url) {
              setOwnerProfilePic(ownerData.data.profile_picture_url);
            }
          }
        } catch (error) {
          console.log('Could not load owner profile picture:', error);
        }
      }
    };
    loadUserProfiles();
  }, [session, item]);

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
      setError(null); // Clear any previous errors
      const response = await itemsAPI.getById(id);
      if (response.success) {
        setItem(response.data);
      } else {
        const errorMsg = response.error || 'Item not found';
        console.error('Failed to load item:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to load item';
      console.error('Error loading item:', err);
      setError(errorMsg);
      // Show error notification as well
      showError(errorMsg);
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

    // Validate message text
    if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
      showError('Please enter a message');
      return;
    }

    try {
      // For owners, include participant_id if a conversation is selected
      const participantId = isOwner && selectedParticipantId ? selectedParticipantId : null;
      await messagesAPI.send(id, messageText.trim(), participantId);
      setMessageText('');
      // Reload messages and conversations to update UI
      loadMessages();
      if (isOwner) {
        loadConversations();
      }
      // Message sent successfully - no need to show notification for every message
    } catch (err) {
      showError(`Error sending message: ${err.message || 'Failed to send message'}`);
    }
  };

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [selectedParticipantName, setSelectedParticipantName] = useState(null);
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState(null);
  const [ownerProfilePic, setOwnerProfilePic] = useState(null);
  const selectedParticipantIdRef = useRef(null);
  const hasAutoSelectedRef = useRef(false);

  // Load conversations list (for owners)
  // Note: isOwner is already declared earlier in the file
  useEffect(() => {
    if (isOwner && item) {
      loadConversations(true); // First load
      // Poll for new conversations every 3 seconds
      const interval = setInterval(() => loadConversations(false), 3000);
      return () => clearInterval(interval);
    }
  }, [id, isOwner, item]);

  const loadConversations = async (isInitialLoad = false) => {
    if (!isOwner || !item) return;
    try {
      const response = await messagesAPI.getConversations(id);
      if (response && response.success) {
        const conversationsData = response.data || [];
        setConversations(conversationsData);
        
        // Update the selected participant name if the selected conversation exists in the new data
        // This ensures the name stays in sync even during polling
        setSelectedParticipantId(currentId => {
          if (currentId) {
            // User has made a selection - preserve it and update name if needed
            const selectedConv = conversationsData.find(c => c.participant_id === currentId);
            if (selectedConv?.participant_name) {
              setSelectedParticipantName(selectedConv.participant_name);
            }
            return currentId;
          } else if (isInitialLoad && !hasAutoSelectedRef.current && conversationsData.length > 0) {
            // Only auto-select on the very first load if no selection exists
            hasAutoSelectedRef.current = true;
            setSelectedParticipantName(conversationsData[0].participant_name);
            return conversationsData[0].participant_id;
          }
          return currentId;
        });
      }
    } catch (err) {
      console.log('Error loading conversations:', err.message || err);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Update selected participant name when conversations or messages change
  useEffect(() => {
    if (selectedParticipantId && !selectedParticipantName) {
      // Try to get name from conversations
      const conversation = conversations.find(c => c.participant_id === selectedParticipantId);
      if (conversation?.participant_name) {
        setSelectedParticipantName(conversation.participant_name);
        return;
      }
      // Try to get name from messages
      if (messages.length > 0) {
        const participantMessage = messages.find(m => m.sender_id === selectedParticipantId);
        if (participantMessage?.sender_name) {
          setSelectedParticipantName(participantMessage.sender_name);
          return;
        }
        if (participantMessage?.sender_email) {
          setSelectedParticipantName(participantMessage.sender_email);
        }
      }
    }
  }, [selectedParticipantId, conversations, messages, selectedParticipantName]);

  // Update ref whenever selectedParticipantId changes
  useEffect(() => {
    selectedParticipantIdRef.current = selectedParticipantId;
  }, [selectedParticipantId]);

  // Load messages for selected conversation
  // This function uses the ref to always get the latest selectedParticipantId, avoiding stale closures
  const loadMessages = async () => {
    if (!item) return;
    // Use ref to get the latest value (avoids stale closures in interval)
    const currentParticipantId = selectedParticipantIdRef.current;
    // For owners, ensure we have a selected participant before loading
    if (isOwner && !currentParticipantId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    try {
      const response = await messagesAPI.getByItem(id, isOwner ? currentParticipantId : null);
      if (response && response.success) {
        setMessages(response.data || []);
      } else {
        // If response is not successful, set empty messages
        setMessages([]);
      }
    } catch (err) {
      // Silently handle errors - just set empty messages
      // This prevents error popups when user is not authenticated
      console.log('Error loading messages (using empty messages):', err.message || err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Load messages when selection changes or item loads
  useEffect(() => {
    if (!item) return;
    // Don't load messages if owner hasn't selected a participant yet
    if (isOwner && !selectedParticipantId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    
    // Load messages immediately when selection changes
    loadMessages();
    // Poll for new messages every 2 seconds (or use realtime)
    const interval = setInterval(() => {
      // Use ref to check current selection (avoids stale closures)
      const currentParticipantId = selectedParticipantIdRef.current;
      // Only poll if we have a valid selection (for owners)
      if (!isOwner || currentParticipantId) {
        loadMessages();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, selectedParticipantId, item, isOwner]);

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
    <div className="container mx-auto px-2 py-6 max-w-7xl">
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
              className="w-full h-96 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
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
                              return formatDateTimeEST(displayDate);
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
                if (response.data?.auto_deleted) {
                  showWarning('This item has been automatically deleted due to multiple reports.');
                  // Navigate away since item no longer exists
                  setTimeout(() => {
                    navigate('/');
                  }, 2000);
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

        {/* Messages Section */}
        {isOwner ? (
          /* Owner View: Conversations List + Selected Conversation - Messenger Style */
          <div className="flex mt-6 -mx-2 h-[700px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Left: Conversations List */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm">No conversations yet.</p>
                    <p className="text-gray-400 text-xs mt-2">Wait for borrowers to message you</p>
                  </div>
                ) : (
                  <div>
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.participant_id}
                        onClick={() => {
                          // Set selection immediately - this will trigger messages to reload via useEffect
                          setSelectedParticipantId(conversation.participant_id);
                          setSelectedParticipantName(conversation.participant_name);
                        }}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedParticipantId === conversation.participant_id
                            ? 'bg-white border-l-4 border-l-umass-maroon'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 relative">
                            {conversation.participant_profile_picture_url ? (
                              <img
                                src={conversation.participant_profile_picture_url}
                                alt={conversation.participant_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  // Fallback to initial if image fails to load
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold bg-umass-maroon text-white ${
                                conversation.participant_profile_picture_url ? 'hidden' : ''
                              }`}
                              style={{ display: conversation.participant_profile_picture_url ? 'none' : 'flex' }}
                            >
                              {conversation.participant_name.charAt(0).toUpperCase()}
                            </div>
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-[10px] font-bold text-white">
                                  {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold truncate text-sm text-gray-900">
                                {conversation.participant_name}
                              </p>
                            </div>
                            <p className="text-xs truncate text-gray-600">
                              {conversation.last_message_text || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Conversation - Messenger Style */}
            <div className="flex-1 min-w-0 bg-white flex flex-col">
              {selectedParticipantId ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
                    {(() => {
                      const conversation = conversations.find(c => c.participant_id === selectedParticipantId);
                      const profilePic = conversation?.participant_profile_picture_url;
                      const name = selectedParticipantName || conversation?.participant_name || 'User';
                      return (
                        <>
                          <div className="flex-shrink-0">
                            {profilePic ? (
                              <img
                                src={profilePic}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-umass-maroon text-white ${
                                profilePic ? 'hidden' : ''
                              }`}
                              style={{ display: profilePic ? 'none' : 'flex' }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-gray-900 truncate">
                              {name}
                            </h2>
                            <p className="text-xs text-gray-500">Active now</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-500 mb-2">No messages yet.</p>
                          <p className="text-gray-400 text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((message, index) => {
                          const isOwnMessage = message.sender_id === session?.user?.id;
                          const prevMessage = index > 0 ? messages[index - 1] : null;
                          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                          const sameSender = prevMessage && prevMessage.sender_id === message.sender_id;
                          const showTimestamp = !nextMessage || nextMessage.sender_id !== message.sender_id || 
                                              new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes
                          
                          // Get the other participant's name and profile picture
                          let senderName, senderProfilePic;
                          if (isOwnMessage) {
                            senderName = 'You';
                            senderProfilePic = currentUserProfilePic || message.sender_profile_picture_url || null;
                          } else {
                            const conversation = conversations.find(c => c.participant_id === selectedParticipantId);
                            senderName = conversation?.participant_name || 
                                        message.sender_name || 
                                        message.sender_email || 
                                        'Unknown User';
                            senderProfilePic = conversation?.participant_profile_picture_url || 
                                             message.sender_profile_picture_url || 
                                             null;
                          }
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2 ${sameSender ? 'mt-0.5' : 'mt-3'}`}
                            >
                              {!isOwnMessage && (
                                <div className="flex-shrink-0 w-8 h-8 mb-1">
                                  {sameSender ? (
                                    <div className="w-8"></div>
                                  ) : senderProfilePic ? (
                                    <img
                                      src={senderProfilePic}
                                      alt={senderName}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-umass-maroon text-white ${
                                      sameSender || senderProfilePic ? 'hidden' : ''
                                    }`}
                                    style={{ display: (sameSender || senderProfilePic) ? 'none' : 'flex' }}
                                  >
                                    {senderName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              )}
                              <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[65%]`}>
                                {!sameSender && !isOwnMessage && (
                                  <p className="text-xs font-semibold text-gray-700 mb-1 px-1">
                                    {senderName}
                                  </p>
                                )}
                                <div className={`rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-umass-maroonLight text-gray-900 border-2 border-umass-maroon'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}>
                                  <p className="text-sm leading-relaxed break-words text-gray-900 font-medium">
                                    {message.text}
                                  </p>
                                </div>
                                {showTimestamp && (
                                  <p className="text-xs text-gray-500 mt-1 px-1">
                                    {formatTimeEST(message.created_at)}
                                  </p>
                                )}
                              </div>
                              {isOwnMessage && (
                                <div className="flex-shrink-0 w-8 h-8 mb-1">
                                  {sameSender ? (
                                    <div className="w-8"></div>
                                  ) : senderProfilePic ? (
                                    <img
                                      src={senderProfilePic}
                                      alt="You"
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-400 text-white ${
                                      sameSender || senderProfilePic ? 'hidden' : ''
                                    }`}
                                    style={{ display: (sameSender || senderProfilePic) ? 'none' : 'flex' }}
                                  >
                                    Y
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Send Message Form */}
                  {session && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-umass-maroon focus:border-transparent transition-all"
                        />
                        <button
                          type="submit"
                          className="bg-umass-maroon text-white px-6 py-2 rounded-full hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          disabled={!messageText.trim()}
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Select a conversation</p>
                    <p className="text-gray-400 text-sm mt-1">Choose a conversation from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Borrower View: Single Conversation - Messenger Style */
          <div className="mt-6 h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
              <div className="flex-shrink-0">
                {ownerProfilePic ? (
                  <img
                    src={ownerProfilePic}
                    alt={item.owner_name || 'Item Owner'}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 rounded-full bg-umass-maroon flex items-center justify-center text-sm font-semibold text-white ${
                    ownerProfilePic ? 'hidden' : ''
                  }`}
                  style={{ display: ownerProfilePic ? 'none' : 'flex' }}
                >
                  {item.owner_name ? item.owner_name.charAt(0).toUpperCase() : 'O'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {item.owner_name || 'Item Owner'}
                </h2>
                <p className="text-xs text-gray-500">Private conversation</p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No messages yet.</p>
                    <p className="text-gray-400 text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === session?.user?.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const sameSender = prevMessage && prevMessage.sender_id === message.sender_id;
                    const showTimestamp = !nextMessage || nextMessage.sender_id !== message.sender_id || 
                                        new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes
                    
                    const senderName = isOwnMessage 
                      ? 'You' 
                      : (message.sender_name || message.sender_email || item.owner_name || 'Item Owner');
                    const senderProfilePic = isOwnMessage 
                      ? (currentUserProfilePic || message.sender_profile_picture_url || null)
                      : (message.sender_profile_picture_url || ownerProfilePic || null);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2 ${sameSender ? 'mt-0.5' : 'mt-3'}`}
                      >
                        {!isOwnMessage && (
                          <div className="flex-shrink-0 w-8 h-8 mb-1">
                            {sameSender ? (
                              <div className="w-8"></div>
                            ) : senderProfilePic ? (
                              <img
                                src={senderProfilePic}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-umass-maroon text-white ${
                                sameSender || senderProfilePic ? 'hidden' : ''
                              }`}
                              style={{ display: (sameSender || senderProfilePic) ? 'none' : 'flex' }}
                            >
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[65%]`}>
                          {!sameSender && !isOwnMessage && (
                            <p className="text-xs font-semibold text-gray-700 mb-1 px-1">
                              {senderName}
                            </p>
                          )}
                          <div className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-umass-maroonLight text-gray-900 border-2 border-umass-maroon'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm leading-relaxed break-words text-gray-900 font-medium">
                              {message.text}
                            </p>
                          </div>
                          {showTimestamp && (
                            <p className="text-xs text-gray-500 mt-1 px-1">
                              {formatTimeEST(message.created_at)}
                            </p>
                          )}
                        </div>
                        {isOwnMessage && (
                          <div className="flex-shrink-0 w-8 h-8 mb-1">
                            {sameSender ? (
                              <div className="w-8"></div>
                            ) : senderProfilePic ? (
                              <img
                                src={senderProfilePic}
                                alt="You"
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-400 text-white ${
                                sameSender || senderProfilePic ? 'hidden' : ''
                              }`}
                              style={{ display: (sameSender || senderProfilePic) ? 'none' : 'flex' }}
                            >
                              Y
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send Message Form */}
            {session ? (
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-umass-maroon focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-umass-maroon text-white px-6 py-2 rounded-full hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={!messageText.trim()}
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-yellow-50">
                <p className="text-yellow-800 text-sm text-center">
                  Please sign in to send a message.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;

