/**
 * User authentication helper
 * Currently returns a placeholder user until Supabase Auth is integrated
 * 
 * TODO: Replace with actual Supabase Auth when authentication is added
 */
import { User } from './types';

// Fixed UUID for dev-user placeholder (matches test scripts)
const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Get the current authenticated user
 * 
 * For now, returns a placeholder user. When Supabase Auth is added:
 * 1. Extract user from Supabase session
 * 2. Validate session is active
 * 3. Return user object or throw error if not authenticated
 * 
 * @returns Promise<User> - The current authenticated user
 */
export async function getUser(): Promise<User> {
  // TODO: Replace with actual Supabase Auth
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session?.user) {
  //   throw new Error('Unauthorized');
  // }
  // return session.user;
  
  // Placeholder implementation
  return {
    id: PLACEHOLDER_USER_ID,
    email: 'dev-user@umass.edu',
    name: 'Dev User',
  };
}

/**
 * Get the current user ID
 * Convenience function that returns just the user ID
 * 
 * @returns Promise<string> - The current user ID
 */
export async function getUserId(): Promise<string> {
  const user = await getUser();
  return user.id;
}

