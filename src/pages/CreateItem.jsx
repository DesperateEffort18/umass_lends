/**
 * Create Item Page
 * Form to create a new item
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemsAPI } from '../utils/api';
import { uploadImage } from '../utils/imageUpload';

const CreateItem = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    image_url: '',
    available: true,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/signin');
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session) {
      alert('Please sign in to create an item');
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload image if one is selected
      let imageUrl = formData.image_url;
      if (selectedImage) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(selectedImage, session.user?.id || session.user_id);
          setFormData({ ...formData, image_url: imageUrl });
        } catch (uploadError) {
          setError(`Failed to upload image: ${uploadError.message}`);
          setUploading(false);
          setLoading(false);
          return;
        }
        setUploading(false);
      }

      // Create item with image URL
      const itemData = {
        ...formData,
        image_url: imageUrl || null,
      };

      const response = await itemsAPI.create(itemData);
      
      if (response.success) {
        // Redirect to item detail page
        navigate(`/items/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create item');
      }
    } catch (err) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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

      // Clear manual URL input if image is selected
      setFormData({ ...formData, image_url: '' });
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
  };

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Item</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block mb-2 font-semibold">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., MacBook Pro 16 inch"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Describe your item..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block mb-2 font-semibold">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., Electronics, Books, Clothing"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block mb-2 font-semibold">Condition</label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select condition</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block mb-2 font-semibold">Item Image</label>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-md h-64 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-red-600 hover:text-red-800 text-sm"
              >
                Remove Image
              </button>
            </div>
          )}

          {/* File Input */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload an image from your computer (max 5MB)
          </p>

          {/* Or use URL (optional) */}
          {!selectedImage && (
            <div className="mt-4">
              <label className="block mb-2 text-sm font-semibold">Or paste image URL:</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </div>

        {/* Available */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="available"
            checked={formData.available}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="font-semibold">Available for borrowing</label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark disabled:opacity-50 font-semibold transition-colors shadow-md"
          >
            {uploading ? 'Uploading image...' : loading ? 'Creating...' : 'Create Item'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border-2 border-umass-maroon text-umass-maroon rounded-lg hover:bg-umass-lightGray disabled:opacity-50 font-semibold transition-colors"
            disabled={loading || uploading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItem;

