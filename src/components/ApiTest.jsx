/**
 * API Test Component
 * Use this component to test your backend API endpoints
 * Add it to your Dashboard or create a test route
 */

import React, { useState } from 'react';
import { UserAuth } from '../context/AuthContext';

const ApiTest = () => {
  const { session } = UserAuth();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:3000';

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint, options = {}) => {
    if (!session?.access_token) {
      alert('Not signed in!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        },
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      return data;
    } catch (error) {
      console.error('API call error:', error);
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error.message || 'Failed to fetch',
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  // Test functions
  const testCreateItem = async () => {
    await apiCall('/api/items', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Item from React',
        description: 'Testing API from React component',
        category: 'Electronics',
        condition: 'Good',
        available: true,
      }),
    });
  };

  const testGetItems = async () => {
    await apiCall('/api/items', { method: 'GET' });
  };

  const testGetMyRequests = async () => {
    await apiCall('/api/borrow/mine', { method: 'GET' });
  };

  const testSendMessage = async () => {
    const itemId = prompt('Enter item ID:');
    if (!itemId) return;

    await apiCall('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        text: 'Hello! Is this item available?',
      }),
    });
  };

  const testUnauthorized = async () => {
    // Test without token
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
        body: JSON.stringify({
          title: 'This should fail',
        }),
      });

      const data = await response.json();
      setResults(prev => ({
        ...prev,
        '/api/items (no auth)': {
          status: response.status,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        '/api/items (no auth)': {
          error: error.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4">
        <p>Please sign in to test the API</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Test Panel</h1>
      <p className="mb-4">Signed in as: {session.user.email}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testCreateItem}
          disabled={loading}
          className="px-4 py-2 bg-umass-maroon text-white rounded hover:bg-umass-maroonDark disabled:opacity-50 font-semibold transition-colors"
        >
          Test: Create Item
        </button>

        <button
          onClick={testGetItems}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test: Get Items
        </button>

        <button
          onClick={testGetMyRequests}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test: Get My Requests
        </button>

        <button
          onClick={testSendMessage}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test: Send Message
        </button>

        <button
          onClick={testUnauthorized}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Test: Unauthorized (should fail)
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Results:</h2>
        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]) => (
            <div key={endpoint} className="border p-4 rounded">
              <h3 className="font-bold">{endpoint}</h3>
              <p className="text-sm text-gray-600">
                Status: {result.status} | Time: {result.timestamp}
              </p>
              <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto text-sm">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-umass-lightGray rounded border border-umass-maroon">
        <h3 className="font-bold mb-2">Your Access Token:</h3>
        <p className="text-xs break-all bg-white p-2 rounded">
          {session.access_token}
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(session.access_token);
            alert('Token copied to clipboard!');
          }}
          className="mt-2 px-3 py-1 bg-umass-maroon text-white rounded text-sm hover:bg-umass-maroonDark transition-colors"
        >
          Copy Token
        </button>
      </div>
    </div>
  );
};

export default ApiTest;

