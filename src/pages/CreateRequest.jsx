/**
 * Create Request Page
 * Form to create a new item request
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { itemRequestsAPI } from '../utils/api';

const CreateRequest = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
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
      setError('Please sign in to create a request');
      navigate('/signin');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await itemRequestsAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
      });
      
      if (response.success) {
        // Redirect to my requests page
        navigate('/my-requests');
      } else {
        setError(response.error || 'Failed to create request');
      }
    } catch (err) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Request an Item</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
        <div>
          <label className="block mb-2 font-semibold">
            Item Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., MacBook Charger, Calculator, etc."
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what you're looking for..."
            rows={4}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none"
          >
            <option value="">Select a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Tools">Tools</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Furniture">Furniture</option>
            <option value="Clothing">Clothing</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>💡 How it works:</strong> Once you submit this request, lenders will be able to see it and accept it. 
            When a lender accepts your request, they'll create an item listing that you can then borrow from.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-umass-maroon text-umass-cream px-6 py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;

