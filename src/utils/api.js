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
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Handle network errors
    if (!response) {
      throw new Error(`Failed to connect to server. Make sure the backend is running at ${API_BASE}`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `Server error: ${response.status} ${response.statusText}` 
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server at ${API_BASE}. Make sure the backend is running on port 3000.`);
    }
    throw error;
  }
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
  submit: (itemId, startDate, endDate, durationMetadata = {}) => {
    return apiRequest(`/api/items/${itemId}/borrow`, {
      method: 'POST',
      body: JSON.stringify({
        borrow_start_date: startDate,
        borrow_end_date: endDate,
        ...durationMetadata, // Include startTime, hours, minutes, exactReturnDateTime
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

  // Mark item as returned
  markReturned: (requestId) => {
    return apiRequest(`/api/borrow/${requestId}/mark-returned`, {
      method: 'POST',
    });
  },

  // Cancel request (borrower only)
  cancel: (requestId) => {
    return apiRequest(`/api/borrow/${requestId}/cancel`, {
      method: 'POST',
    });
  },

  // Mark item as picked up (lender only) - starts the countdown timer
  markPickedUp: (requestId) => {
    return apiRequest(`/api/borrow/${requestId}/mark-picked-up`, {
      method: 'POST',
    });
  },
};

// Messages API
export const messagesAPI = {
  // Get messages for an item (requires authentication for private conversations)
  getByItem: async (itemId) => {
    try {
      // Try authenticated request first
      return await apiRequest(`/api/messages?itemId=${itemId}`);
    } catch (error) {
      // If not authenticated or any other error, return empty messages
      // This allows the page to load even if user is not signed in
      console.log('Error fetching messages (returning empty):', error.message);
      return { success: true, data: [] };
    }
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

// Profile API
export const profileAPI = {
  // Get user profile
  get: () => {
    return apiRequest('/api/profile');
  },

  // Update user profile
  update: (profileData) => {
    return apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: (currentPassword, newPassword) => {
    return apiRequest('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },
};

// Collateral API
export const collateralAPI = {
  // Get collateral recommendations for an item
  getRecommendations: (itemId, limit = 5) => {
    return publicApiRequest(`/api/collateral?itemId=${itemId}&limit=${limit}`);
  },
};

// Users API
export const usersAPI = {
  // Get user profile by ID (public info only)
  getById: (userId) => {
    return publicApiRequest(`/api/users/${userId}`);
  },
};

// Reports API
export const reportsAPI = {
  // Report an item
  report: (itemId, reason) => {
    return apiRequest(`/api/items/${itemId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Item Requests API
export const itemRequestsAPI = {
  // Get item requests
  get: (options = {}) => {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.mine) params.append('mine', 'true');
    const query = params.toString();
    return apiRequest(`/api/item-requests${query ? `?${query}` : ''}`);
  },

  // Create item request
  create: (requestData) => {
    return apiRequest('/api/item-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  // Accept item request
  accept: (requestId, itemData) => {
    return apiRequest(`/api/item-requests/${requestId}/accept`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },
};

// Export default API helper
export default {
  items: itemsAPI,
  borrow: borrowAPI,
  messages: messagesAPI,
  recommendations: recommendationsAPI,
  profile: profileAPI,
  collateral: collateralAPI,
  users: usersAPI,
  reports: reportsAPI,
  itemRequests: itemRequestsAPI,
};

