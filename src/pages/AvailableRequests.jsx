/**
 * Available Requests Page
 * Shows open item requests that lenders can accept
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemRequestsAPI } from '../utils/api';
import { uploadImage } from '../utils/imageUpload';

const AvailableRequests = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptFormData, setAcceptFormData] = useState({
    condition: '',
    location: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      const response = await itemRequestsAPI.get({ status: 'open' });
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

  const handleAcceptClick = (request) => {
    setSelectedRequest(request);
    setAcceptFormData({ condition: '', location: '' });
    setSelectedImage(null);
    setImagePreview(null);
    setShowAcceptModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !session) return;

    try {
      setAcceptingRequestId(selectedRequest.id);
      setError(null);

      let imageUrl = null;
      if (selectedImage && session.user?.id) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage, session.user.id);
        } catch (uploadError) {
          setError(`Failed to upload image: ${uploadError.message}`);
          setUploadingImage(false);
          setAcceptingRequestId(null);
          return;
        }
        setUploadingImage(false);
      }

      const response = await itemRequestsAPI.accept(selectedRequest.id, {
        condition: acceptFormData.condition || null,
        location: acceptFormData.location || null,
        image_url: imageUrl,
      });

      if (response.success) {
        setShowAcceptModal(false);
        setSelectedRequest(null);
        // Reload requests
        await loadRequests();
        // Navigate to the created item
        if (response.data?.item?.id) {
          navigate(`/items/${response.data.item.id}`);
        }
      } else {
        setError(response.error || 'Failed to accept request');
      }
    } catch (err) {
      setError(err.message || 'Failed to accept request');
    } finally {
      setAcceptingRequestId(null);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Available Requests</h1>
        <p className="text-center">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Available Requests</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
          <p className="text-gray-600">No open requests available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">{request.title}</h3>

              {request.description && (
                <p className="text-gray-600 mb-3 line-clamp-3">{request.description}</p>
              )}

              {request.category && (
                <span className="inline-block mb-3 px-2 py-1 bg-umass-maroon text-umass-cream text-xs rounded">
                  {request.category}
                </span>
              )}

              <div className="text-sm text-gray-500 mb-4">
                Requested: {new Date(request.created_at).toLocaleDateString()}
              </div>

              <button
                onClick={() => handleAcceptClick(request)}
                className="w-full bg-umass-maroon text-umass-cream px-4 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
              >
                Accept Request
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-umass-maroon">Accept Request</h2>
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setSelectedRequest(null);
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Request:</p>
                <p className="font-semibold text-gray-900">{selectedRequest.title}</p>
                {selectedRequest.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
                )}
              </div>

              <form onSubmit={handleAccept} className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold">Condition</label>
                  <select
                    value={acceptFormData.condition}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, condition: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
                  >
                    <option value="">Select condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Location</label>
                  <input
                    type="text"
                    value={acceptFormData.location}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, location: e.target.value })}
                    placeholder="e.g., Southwest Residential Area"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Item Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAcceptModal(false);
                      setSelectedRequest(null);
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={acceptingRequestId === selectedRequest.id || uploadingImage}
                    className="flex-1 bg-umass-maroon text-umass-cream px-4 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : acceptingRequestId === selectedRequest.id ? 'Accepting...' : 'Accept & Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableRequests;

