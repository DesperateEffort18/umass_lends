/**
 * User Info Modal
 * Shows user profile information including payment methods and profile picture
 */
import React, { useState, useEffect } from 'react';
import { usersAPI } from '../utils/api';

const UserInfoModal = ({ isOpen, onClose, userId }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserInfo();
    }
  }, [isOpen, userId]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getById(userId);
      if (response.success && response.data) {
        setUserInfo(response.data);
      } else {
        setError(response.error || 'Failed to load user information');
      }
    } catch (err) {
      setError(err.message || 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasPaymentMethods = userInfo && (
    userInfo.venmo_username ||
    userInfo.cashapp_username ||
    userInfo.zelle_email
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-umass-maroon">
              👤 User Information
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading user information...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* User Info */}
          {!loading && !error && userInfo && (
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-4">
                {userInfo.profile_picture_url ? (
                  <img
                    src={userInfo.profile_picture_url}
                    alt={userInfo.name || 'User'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-umass-maroon"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-umass-maroon flex items-center justify-center">
                    <span className="text-4xl text-gray-400">👤</span>
                  </div>
                )}
                <h3 className="mt-3 text-xl font-bold text-gray-900">
                  {userInfo.name || userInfo.email || 'Unknown User'}
                </h3>
                {userInfo.email && userInfo.name && (
                  <p className="text-sm text-gray-600">{userInfo.email}</p>
                )}
              </div>

              {/* Payment Methods */}
              {hasPaymentMethods ? (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    💳 Payment Methods
                  </h4>
                  <div className="space-y-2">
                    {userInfo.venmo_username && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <span className="font-semibold text-green-700">Venmo:</span>
                        <span className="text-gray-700">{userInfo.venmo_username}</span>
                      </div>
                    )}
                    {userInfo.cashapp_username && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <span className="font-semibold text-green-700">CashApp:</span>
                        <span className="text-gray-700">{userInfo.cashapp_username}</span>
                      </div>
                    )}
                    {userInfo.zelle_email && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <span className="font-semibold text-blue-700">Zelle:</span>
                        <span className="text-gray-700">{userInfo.zelle_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 text-center">
                    No payment methods available
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;

