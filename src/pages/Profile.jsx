/**
 * Profile Page
 * Allows users to update their profile picture, payment methods, and change password
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { profileAPI } from '../utils/api';
import { uploadProfilePicture } from '../utils/imageUpload';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Profile data
  const [profile, setProfile] = useState({
    venmo_username: '',
    cashapp_username: '',
    zelle_email: '',
    profile_picture_url: null,
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile picture
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/signin');
      return;
    }
    loadProfile();
  }, [session, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.get();
      if (response.success && response.data) {
        setProfile({
          venmo_username: response.data.venmo_username || '',
          cashapp_username: response.data.cashapp_username || '',
          zelle_email: response.data.zelle_email || '',
          profile_picture_url: response.data.profile_picture_url || null,
        });
        if (response.data.profile_picture_url) {
          setImagePreview(response.data.profile_picture_url);
        }
      } else if (response.error && (response.error.includes('Unauthorized') || response.error.includes('Invalid or expired token'))) {
        // Token expired - clear session and redirect to sign in
        setError('Your session has expired. Please sign in again.');
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load profile';
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid or expired token') || errorMessage.includes('Not authenticated')) {
        // Clear expired session
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(profile.profile_picture_url || null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      let profilePictureUrl = profile.profile_picture_url;

      // Upload new profile picture if one is selected
      if (selectedImage && session?.user?.id) {
        setUploadingImage(true);
        try {
          profilePictureUrl = await uploadProfilePicture(selectedImage, session.user.id);
        } catch (uploadError) {
          setError(`Failed to upload profile picture: ${uploadError.message}`);
          setUploadingImage(false);
          setSaving(false);
          return;
        }
        setUploadingImage(false);
      }

      // Update profile
      const updateData = {
        ...profile,
        profile_picture_url: profilePictureUrl,
      };

      const response = await profileAPI.update(updateData);
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setProfile({ ...profile, profile_picture_url: profilePictureUrl });
        setSelectedImage(null);
        // Reload profile to get updated data
        await loadProfile();
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await profileAPI.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );

      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        setPasswordError(response.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <p className="text-center">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          {(error.includes('Unauthorized') || error.includes('Invalid or expired token')) && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/signin')}
                className="bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-semibold transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-green-600 font-semibold">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Picture Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-umass-maroon">Profile Picture</h2>
          
          <div className="flex flex-col items-center mb-4">
            {/* Circular Profile Picture */}
            <div className="relative mb-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-umass-maroon"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-umass-maroon flex items-center justify-center">
                  <span className="text-4xl text-gray-400">👤</span>
                </div>
              )}
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <span className="px-4 py-2 bg-umass-maroon text-umass-cream rounded-lg hover:bg-umass-maroonDark transition-colors font-medium">
                {imagePreview ? 'Change Picture' : 'Upload Picture'}
              </span>
            </label>

            {imagePreview && (
              <button
                onClick={handleRemoveImage}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove Picture
              </button>
            )}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-umass-maroon">Payment Methods</h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">
                Venmo Username
              </label>
              <input
                type="text"
                name="venmo_username"
                value={profile.venmo_username}
                onChange={handleProfileChange}
                placeholder="@username"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">
                CashApp Username
              </label>
              <input
                type="text"
                name="cashapp_username"
                value={profile.cashapp_username}
                onChange={handleProfileChange}
                placeholder="$username"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">
                Zelle (Email or Phone)
              </label>
              <input
                type="text"
                name="zelle_email"
                value={profile.zelle_email}
                onChange={handleProfileChange}
                placeholder="email@example.com or phone number"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50 shadow-md"
            >
              {uploadingImage ? 'Uploading Picture...' : saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-umass-maroon">Change Password</h2>
        
        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="text-red-600 text-sm">{passwordError}</p>
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
            <p className="text-green-600 text-sm">{passwordSuccess}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">Current Password</label>
            <input
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">New Password</label>
            <input
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50 shadow-md"
          >
            {changingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

