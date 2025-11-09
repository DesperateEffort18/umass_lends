/**
 * API helper functions for making authenticated requests
 */
import { supabase } from '../supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get the current session token
 */
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make a public API request (no auth required)
 */
async function publicApiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Items API
export const itemsAPI = {
  // Get all items
  getAll: (available = null) => {
    const query = available !== null ? `?available=${available}` : '';
    return publicApiRequest(`/api/items${query}`);
  },

  // Get single item
  getById: (id) => {
    return publicApiRequest(`/api/items/${id}`);
  },

  // Create item
  create: (itemData) => {
    return apiRequest('/api/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Update item (if you add this endpoint later)
  update: (id, itemData) => {
    return apiRequest(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  // Delete item (if you add this endpoint later)
  delete: (id) => {
    return apiRequest(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },
};

// Borrow Requests API
export const borrowAPI = {
  // Submit borrow request
  submit: (itemId, startDate, endDate) => {
    return apiRequest(`/api/items/${itemId}/borrow`, {
      method: 'POST',
      body: JSON.stringify({
        borrow_start_date: startDate,
        borrow_end_date: endDate,
      }),
    });
  },

  // Get my borrow requests
  getMine: (status = null) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/api/borrow/mine${query}`);
  },

  // Approve request
  approve: (requestId) => {
    return apiRequest(`/api/borrow/${requestId}/approve`, {
      method: 'POST',
    });
  },

  // Reject request
  reject: (requestId) => {
    return apiRequest(`/api/borrow/${requestId}/reject`, {
      method: 'POST',
    });
  },
};

// Messages API
export const messagesAPI = {
  // Get messages for an item
  getByItem: (itemId) => {
    return publicApiRequest(`/api/messages?itemId=${itemId}`);
  },

  // Send message
  send: (itemId, text) => {
    return apiRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        text,
      }),
    });
  },
};

// Recommendations API
export const recommendationsAPI = {
  // Get recommended items based on current time period
  get: (limit = 6, period = null) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (period) params.append('period', period);
    const query = params.toString();
    return publicApiRequest(`/api/recommendations${query ? `?${query}` : ''}`);
  },
};

// Export default API helper
export default {
  items: itemsAPI,
  borrow: borrowAPI,
  messages: messagesAPI,
  recommendations: recommendationsAPI,
};

