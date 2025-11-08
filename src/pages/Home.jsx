/**
 * Home Page - Browse Items
 * Displays all available items for browsing
 */

import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../utils/api';
import ItemCard from '../components/ItemCard';

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadItems();
  }, [filterAvailable]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll(filterAvailable);
      if (response.success) {
        setItems(response.data || []);
      } else {
        setError(response.error || 'Failed to load items');
      }
    } catch (err) {
      setError(err.message || 'Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];

  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Browse Items</h1>
        <p className="text-center">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Items</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border-2 border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="font-semibold">⚠️ {error}</p>
          <p className="text-sm mt-2">Make sure your backend is running on http://localhost:3000</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          {/* Availability Filter */}
          <select
            value={filterAvailable === null ? 'all' : filterAvailable.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setFilterAvailable(value === 'all' ? null : value === 'true');
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Items</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Item Count */}
      <div className="mt-6 text-center text-gray-600">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
};

export default Home;

