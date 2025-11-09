/**
 * Brute Force Protection Utilities
 * Interfaces with Supabase database functions to prevent brute force attacks
 */

import { supabase } from '../supabaseClient';

/**
 * Check if an email is currently blocked due to brute force protection
 * @param {string} email - The email to check
 * @returns {Promise<{blocked: boolean, attempts?: number}>} - Object indicating if blocked and number of attempts
 */
export async function checkBruteForce(email) {
  try {
    const { data, error } = await supabase.rpc('check_bruteforce', {
      p_email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Error checking brute force:', error);
      // If function doesn't exist or there's an error, allow login (fail open)
      return { blocked: false };
    }

    // Function returns boolean: true if blocked (6+ attempts in last 15 minutes)
    return { blocked: data === true };
  } catch (error) {
    console.error('Error in checkBruteForce:', error);
    // Fail open - allow login if check fails
    return { blocked: false };
  }
}

/**
 * Record a failed login attempt for an email
 * @param {string} email - The email that failed to login
 * @returns {Promise<void>}
 */
export async function recordFailedLogin(email) {
  try {
    const { error } = await supabase.rpc('record_failed_login', {
      p_email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Error recording failed login:', error);
      // Don't throw - we don't want to break login flow if recording fails
    }
  } catch (error) {
    console.error('Error in recordFailedLogin:', error);
    // Don't throw - fail silently
  }
}

/**
 * Reset failed login attempts for an email (called on successful login)
 * @param {string} email - The email that successfully logged in
 * @returns {Promise<void>}
 */
export async function resetFailedLogin(email) {
  try {
    const { error } = await supabase.rpc('reset_failed_login', {
      p_email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Error resetting failed login:', error);
      // Don't throw - we don't want to break login flow if reset fails
    }
  } catch (error) {
    console.error('Error in resetFailedLogin:', error);
    // Don't throw - fail silently
  }
}

