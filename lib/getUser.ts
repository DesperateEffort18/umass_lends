import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { User } from './types';
import { ensureUser } from './ensureUser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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
    // Get the authorization header from the request
    const authHeader = request?.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: No authorization token provided');
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Create a Supabase client with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the user from the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Unauthorized: Invalid or expired token');
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
      throw error;
    }
    
    // Otherwise, wrap in a generic unauthorized error
    console.error('Error getting user:', error);
    throw new Error('Unauthorized: Authentication failed');
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

