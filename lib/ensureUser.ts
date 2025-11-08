/**
 * Ensure user exists in users table
 * Creates a user record if it doesn't exist (for Supabase Auth users)
 */
import { getSupabaseClient } from './supabaseClient';
import { User } from './types';

/**
 * Ensure a user exists in the users table
 * If the user doesn't exist, creates a record
 * 
 * @param userId - The user ID from Supabase Auth
 * @param email - The user's email
 * @param name - The user's name (optional)
 * @returns Promise<User> - The user record
 */
export async function ensureUser(
  userId: string,
  email?: string,
  name?: string
): Promise<User> {
  const supabase = getSupabaseClient();

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingUser) {
    return existingUser as User;
  }

  // User doesn't exist, create it
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email || null,
      name: name || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user record: ${error.message}`);
  }

  return newUser as User;
}

