import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { User } from './types';
import { ensureUser } from './ensureUser';

/**
 * Get Supabase configuration from environment variables
 * Checks at runtime to avoid errors at module load time
 */
function getSupabaseConfig() {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL;
    
  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. ` +
      `Please set them in Vercel dashboard under Settings > Environment Variables. ` +
      `Current env keys: ${Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ') || 'none'}`
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
/**
 * Get the current authenticated user from the request
 * Extracts the Authorization token from headers and validates with Supabase
 * 
 * @param request - Next.js request object
 * @returns Promise<User> - The current authenticated user
 * @throws Error if user is not authenticated
 */
export async function getUser(request?: NextRequest): Promise<User> {
  try {
    // Get Supabase config (throws error if not available)
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    // Get the authorization header from the request
    const authHeader = request?.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: No authorization token provided');
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Validate token exists
    if (!token || token.trim().length === 0) {
      console.error('[getUser] Empty token received');
      throw new Error('Unauthorized: Invalid token format');
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the user from the token
    // Pass the token directly to getUser() - this is the correct way
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('[getUser] Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + '...'
      });
      throw new Error(`Unauthorized: Invalid or expired token - ${error.message}`);
    }
    
    if (!user) {
      console.error('[getUser] No user returned from Supabase auth');
      throw new Error('Unauthorized: Invalid or expired token - No user found');
    }

    // Ensure user exists in users table (for foreign key constraints)
    const userRecord = await ensureUser(
      user.id,
      user.email || undefined,
      user.user_metadata?.name || user.email?.split('@')[0] || undefined
    );

    // Return the user object
    return userRecord;
  } catch (error: any) {
    // If error is already our custom error, rethrow it
    if (error.message?.includes('Unauthorized')) {
      console.error('[getUser] Auth error:', error.message);
      throw error;
    }
    
    // Otherwise, wrap in a generic unauthorized error
    console.error('[getUser] Unexpected error getting user:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw new Error(`Unauthorized: Authentication failed - ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get the current user ID
 * Convenience function that returns just the user ID
 * 
 * @param request - Next.js request object
 * @returns Promise<string> - The current user ID
 */
export async function getUserId(request?: NextRequest): Promise<string> {
  const user = await getUser(request);
  return user.id;
}

/**
 * Get user from request (helper for API routes)
 * This is a convenience wrapper that extracts the request automatically
 * 
 * @param request - Next.js request object
 * @returns Promise<User> - The current authenticated user
 */
export async function getUserFromRequest(request: NextRequest): Promise<User> {
  return getUser(request);
}

