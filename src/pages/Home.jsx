/**
 * Home Page - Browse Items
 * Displays all available items for browsing
 */

import React, { useState, useEffect } from 'react';
import { itemsAPI, recommendationsAPI } from '../utils/api';
import ItemCard from '../components/ItemCard';

const Home = () => {
  const [items, setItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [recommendationExplanation, setRecommendationExplanation] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [aiPowered, setAiPowered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadItems();
  }, [filterAvailable]);

  useEffect(() => {
    loadRecommendations();
  }, []);

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

  const loadRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      // Request 3 recommendations (2-3 as requested)
      const response = await recommendationsAPI.get(3);
      if (response.success && response.data) {
        setRecommendedItems(response.data.items || []);
        setRecommendationExplanation(response.data.explanation || '');
        setCurrentPeriod(response.data.period || '');
        setAiPowered(response.data.aiPowered || false);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      // Don't show error to user, recommendations are optional
    } finally {
      setRecommendationsLoading(false);
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
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4 text-umass-maroonDark">Browse Items</h1>
          <p className="text-umass-stone/60 font-body">Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      {/* Hero Section with Asymmetric Layout */}
      <div className="bg-gradient-maroon text-umass-cream py-16 mb-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-umass-maroonDark/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-umass-maroonLight/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 tracking-tight leading-tight">
              Browse Items
            </h1>
            <p className="text-xl text-umass-lightCream/90 font-body leading-relaxed">
              Discover what UMass students are lending. Save money by borrowing what you need.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-16">
        {/* Error Message */}
        {error && (
          <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-900 px-6 py-4 rounded-md mb-8 shadow-md animate-fade-in-up">
            <p className="font-bold font-accent uppercase tracking-wide mb-1">⚠️ {error}</p>
            <p className="text-sm font-body">Make sure your backend is running on http://localhost:3000</p>
          </div>
        )}

        {/* Recommendations Section */}
        {!recommendationsLoading && recommendedItems.length > 0 && (
          <div className="mb-16 animate-fade-in-up">
            <div className="relative bg-gradient-maroon text-umass-cream p-8 rounded-xl mb-6 shadow-2xl border-2 border-umass-maroonDark/50 overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10"
                   style={{
                     backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
                   }}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <h2 className="text-3xl font-display font-bold">✨ Recommended for You</h2>
                  {aiPowered && (
                    <span className="px-4 py-2 bg-umass-lightCream/20 backdrop-blur-sm text-umass-cream text-sm rounded-full font-accent font-semibold uppercase tracking-wide flex items-center gap-2 border border-umass-cream/20">
                      <span>🤖</span>
                      <span>AI-Powered</span>
                    </span>
                  )}
                </div>
                <p className="text-umass-lightCream text-lg leading-relaxed font-body">
                  {recommendationExplanation}
                  {currentPeriod && (
                    <span className="ml-2 text-sm opacity-80 font-accent uppercase tracking-wide">
                      ({currentPeriod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {recommendedItems.map((item, index) => (
                <div key={item.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
            
            <div className="relative mb-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-umass-maroon/20"></div>
              </div>
              <div className="relative flex justify-center z-10">
                <span className="bg-white px-6 py-2 text-umass-maroon font-accent font-bold uppercase tracking-wider text-sm">
                  ALL ITEMS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-10 space-y-6 animate-fade-in-up">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-body text-umass-charcoal placeholder:text-umass-stone/40 transition-all duration-300 shadow-sm hover:shadow-md"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-umass-stone/40">🔍</span>
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
              className="px-5 py-3 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-accent font-semibold text-umass-charcoal cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <option value="all">All Items</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-5 py-3 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-accent font-semibold text-umass-charcoal cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
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
          <div className="text-center py-20 animate-fade-in-up">
            <div className="max-w-md mx-auto bg-white/60 backdrop-blur-sm rounded-xl p-8 border-2 border-umass-maroon/20 shadow-lg">
              <p className="text-umass-stone/70 font-body text-lg mb-2">No items found.</p>
              <p className="text-umass-stone/50 font-body text-sm">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${(index % 9) * 0.05}s` }}>
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Item Count */}
        <div className="mt-12 text-center animate-fade-in-up">
          <p className="text-umass-stone/60 font-accent uppercase tracking-wider text-sm">
            Showing <span className="font-bold text-umass-maroon">{filteredItems.length}</span> of <span className="font-bold text-umass-maroon">{items.length}</span> items
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

