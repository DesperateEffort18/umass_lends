/**
 * Authentication debugging utilities
 * Use these in browser console to debug auth issues
 */

import { supabase } from '../supabaseClient';

/**
 * Check current authentication status
 * Run this in browser console: debugAuth()
 */
export async function debugAuth() {
  console.group('🔍 Authentication Debug Info');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('📋 Current Session:', session ? '✅ Exists' : '❌ None');
    
    if (session) {
      console.log('   User ID:', session.user?.id);
      console.log('   Email:', session.user?.email);
      console.log('   Access Token:', session.access_token ? '✅ Present' : '❌ Missing');
      console.log('   Refresh Token:', session.refresh_token ? '✅ Present' : '❌ Missing');
      
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const isExpired = expiresAt < now;
        const timeUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60); // minutes
        
        console.log('   Expires At:', expiresAt.toLocaleString());
        console.log('   Is Expired:', isExpired ? '❌ Yes' : '✅ No');
        console.log('   Time Until Expiry:', timeUntilExpiry, 'minutes');
      }
      
      // Try to get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('   Get User:', user ? '✅ Success' : '❌ Failed');
      if (userError) {
        console.error('   User Error:', userError);
      }
    } else {
      console.warn('   No session found. User is not authenticated.');
    }
    
    if (sessionError) {
      console.error('   Session Error:', sessionError);
    }
    
    // Check localStorage for Supabase tokens
    const keys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    console.log('📦 Supabase localStorage keys:', keys.length > 0 ? keys : 'None found');
    
    // Test API call
    console.log('\n🧪 Testing API Token Retrieval...');
    try {
      const token = session?.access_token;
      if (token) {
        console.log('   Token exists:', token.substring(0, 20) + '...');
        
        // Test making a simple API call
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        console.log('   Testing API call to:', `${API_BASE}/api/profile`);
        
        const response = await fetch(`${API_BASE}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('   Response Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ API call successful!', data);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
          console.error('   ❌ API call failed:', errorData);
        }
      } else {
        console.warn('   ⚠️ No token available to test');
      }
    } catch (apiError) {
      console.error('   ❌ API test error:', apiError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
  
  console.groupEnd();
}

/**
 * Force refresh session
 * Run this in browser console: refreshAuth()
 */
export async function refreshAuth() {
  console.log('🔄 Attempting to refresh session...');
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Refresh failed:', error);
      return { success: false, error };
    }
    
    if (data?.session) {
      console.log('✅ Session refreshed successfully!');
      console.log('   New expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
      return { success: true, session: data.session };
    } else {
      console.warn('⚠️ Refresh returned no session');
      return { success: false, error: 'No session returned' };
    }
  } catch (error) {
    console.error('❌ Refresh error:', error);
    return { success: false, error };
  }
}

// Make available globally for easy console access
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  window.refreshAuth = refreshAuth;
}

