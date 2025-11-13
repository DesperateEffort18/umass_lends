/**
 * API helper functions for making authenticated requests
 */
import { supabase } from '../supabaseClient';

// Support both Vite (import.meta.env) and Next.js (process.env) environments
const getApiBase = () => {
  let apiUrl = '';
  
  // Check for explicit API URL in environment variables (production)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      apiUrl = import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    // import.meta not available
  }
  
  if (!apiUrl) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.NEXT_PUBLIC_API_URL) {
          apiUrl = process.env.NEXT_PUBLIC_API_URL;
        } else if (process.env.VITE_API_URL) {
          apiUrl = process.env.VITE_API_URL;
        }
      }
    } catch (e) {
      // process not available
    }
  }
  
  // Default to localhost for development
  if (!apiUrl) {
    apiUrl = 'http://localhost:3000';
  }
  
  // Normalize URL: remove trailing slash to prevent double slashes
  // Example: "https://example.com/" -> "https://example.com"
  return apiUrl.replace(/\/+$/, '');
};

const API_BASE = getApiBase();

// Validate API_BASE in production and show helpful error
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.');
  
  if (isProduction && API_BASE === 'http://localhost:3000') {
    console.error(
      '%c❌ [API] Configuration Error!',
      'color: red; font-weight: bold; font-size: 14px;'
    );
    console.error(
      'The frontend is running in production (' + hostname + ') but VITE_API_URL is not configured.\n' +
      'API calls will fail because they are trying to connect to localhost.\n\n' +
      'To fix this:\n' +
      '1. Go to your deployment platform (Netlify/Vercel)\n' +
      '2. Add environment variable: VITE_API_URL=https://your-backend.vercel.app\n' +
      '3. Replace "your-backend.vercel.app" with your actual backend URL\n' +
      '4. Redeploy your frontend\n\n' +
      'Current API_BASE: ' + API_BASE
    );
  } else {
    console.log('[API] API_BASE URL:', API_BASE);
  }
} else {
  console.log('[API] API_BASE URL:', API_BASE);
}

/**
 * Get the current session token, refreshing if necessary
 */
async function getToken() {
  try {
    // First, try to get the current session
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[API] Error getting session:', error);
      throw new Error('Not authenticated: Failed to get session');
    }
    
    // Check if session exists
    if (!session) {
      console.warn('[API] No session found, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData?.session) {
        console.error('[API] Failed to refresh session:', refreshError);
        throw new Error('Not authenticated: No active session');
      }
      
      session = refreshData.session;
    }
    
    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (expiresAt && (now + bufferTime) >= expiresAt) {
      console.log('[API] Token expired or expiring soon, refreshing...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[API] Error refreshing expired token:', refreshError);
        // If refresh fails, still try with current token
        if (!session.access_token) {
          throw new Error('Not authenticated: Token expired and refresh failed');
        }
      } else if (refreshData?.session) {
        session = refreshData.session;
        console.log('[API] Token refreshed successfully');
      }
    }
    
    if (!session?.access_token) {
      console.error('[API] No access token in session');
      throw new Error('Not authenticated: No access token available');
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[API] Error getting token:', error);
    // Re-throw with more context if it's not already our error
    if (error.message && error.message.includes('Not authenticated')) {
      throw error;
    }
    throw new Error(`Not authenticated: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated: No token available');
    }
    
    // Log token info (first 20 chars only for security)
    console.log(`[API] Making authenticated request to ${endpoint}`);
    console.log(`[API] Token preview: ${token.substring(0, 20)}... (length: ${token.length})`);
    
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
      const errorData = await response.json().catch(() => ({ 
        error: `Server error: ${response.status} ${response.statusText}` 
      }));
      
      console.error(`[API] Request failed for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error
      });
      
      // If it's a 401, it means auth failed
      if (response.status === 401) {
        throw new Error(errorData.error || 'Unauthorized: Authentication failed');
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Request successful for ${endpoint}`);
    return data;
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
  const url = `${API_BASE}${endpoint}`;
  console.log(`[API] Making request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[API] Response status: ${response.status} for ${url}`);

    // Handle network errors
    if (!response) {
      throw new Error(`Failed to connect to server. Make sure the backend is running at ${API_BASE}`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `Server error: ${response.status} ${response.statusText}` 
      }));
      console.error(`[API] Error response:`, error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Success response for ${url}`);
    return data;
  } catch (error) {
    console.error(`[API] Request failed for ${url}:`, error);
    // Handle network errors (CORS, connection refused, etc.)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
      const errorMsg = `Cannot connect to server at ${API_BASE}${endpoint}. Make sure the backend is running on port 3000. Error: ${error.message}`;
      console.error(`[API] Network error:`, errorMsg);
      throw new Error(errorMsg);
    }
    throw error;
  }
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
  getByItem: async (itemId, participantId = null) => {
    try {
      // Try authenticated request first
      const url = participantId 
        ? `/api/messages?itemId=${itemId}&participantId=${participantId}`
        : `/api/messages?itemId=${itemId}`;
      return await apiRequest(url);
    } catch (error) {
      // If not authenticated or any other error, return empty messages
      // This allows the page to load even if user is not signed in
      console.log('Error fetching messages (returning empty):', error.message);
      return { success: true, data: [] };
    }
  },

  // Get conversations list for an item (owner only)
  getConversations: async (itemId) => {
    try {
      return await apiRequest(`/api/messages/conversations?itemId=${itemId}`);
    } catch (error) {
      console.log('Error fetching conversations (returning empty):', error.message);
      return { success: true, data: [] };
    }
  },

  // Send message
  send: (itemId, text, participantId = null) => {
    // Validate inputs
    if (!itemId || !text || typeof text !== 'string' || !text.trim()) {
      return Promise.reject(new Error('Item ID and message text are required'));
    }
    
    const body = {
      item_id: itemId,
      text: text.trim(),
    };
    
    // Only include participant_id if it's provided (not null or undefined)
    if (participantId && typeof participantId === 'string') {
      body.participant_id = participantId;
    }
    
    return apiRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify(body),
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

