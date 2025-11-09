# Brute Force Protection Setup Guide

This guide explains how to set up and use brute force protection for user login.

## Overview

The brute force protection system:
- Blocks login attempts after 6 failed attempts within 15 minutes
- Records failed login attempts in the database
- Resets failed attempts on successful login
- Displays on-screen notifications (no alerts)

## Database Setup

### Step 1: Create the Table and Functions

Run the SQL script in your Supabase SQL Editor:

```bash
database/brute_force_protection.sql
```

This script creates:
- `failed_logins` table to track failed login attempts
- `record_failed_login()` function to record failed attempts
- `check_bruteforce()` function to check if an email is blocked
- `reset_failed_login()` function to reset attempts on successful login
- `cleanup_old_failed_logins()` function to clean up old records

### Step 2: Verify the Setup

You can verify the setup by checking:

1. **Table exists**: Go to Supabase Dashboard → Table Editor → `failed_logins`
2. **Functions exist**: Go to Supabase Dashboard → Database → Functions

## How It Works

### Login Flow

1. **Before Login**: System checks if the email is blocked (6+ attempts in last 15 minutes)
   - If blocked: Shows warning notification and prevents login
   - If not blocked: Proceeds to login attempt

2. **On Failed Login**: System records the failed attempt
   - Increments attempt count for the email
   - Updates last attempt timestamp

3. **On Successful Login**: System resets failed attempts
   - Deletes the email's record from `failed_logins` table

### Protection Threshold

- **Blocked after**: 6 failed attempts
- **Time window**: Last 15 minutes
- **Auto-unblock**: After 15 minutes from last attempt

## Frontend Implementation

The brute force protection is integrated into:

1. **`src/utils/bruteForceProtection.js`**: Utility functions to interact with database functions
2. **`src/context/AuthContext.jsx`**: Updated `signInUser()` to check and record attempts
3. **`src/components/Signin.jsx`**: Shows on-screen notifications for blocked attempts

### Notification Types

- **Warning** (Yellow): Brute force blocked - "Too many failed login attempts. Please try again in 15 minutes."
- **Error** (Red): Other login errors (invalid password, user not found, etc.)

## Testing

### Test Brute Force Protection

1. **Try to login with wrong password 6 times**:
   ```javascript
   // In browser console or test script
   // Try signing in with wrong password 6 times
   ```

2. **7th attempt should be blocked**:
   - You should see a yellow warning notification
   - Login form should not submit
   - Message: "Too many failed login attempts. Please try again in 15 minutes."

3. **Wait 15 minutes**:
   - Attempts should reset automatically
   - You can try logging in again

4. **Successful login resets attempts**:
   - After successful login, all failed attempts are cleared
   - You can immediately try logging in again (even if you were blocked before)

### Test Database Functions (Optional)

You can test the database functions directly in Supabase SQL Editor:

```sql
-- Record a failed login
SELECT public.record_failed_login('test@umass.edu');

-- Check if blocked
SELECT public.check_bruteforce('test@umass.edu');
-- Should return: false (after 1 attempt)

-- Record 5 more failed attempts (total 6)
SELECT public.record_failed_login('test@umass.edu');
SELECT public.record_failed_login('test@umass.edu');
SELECT public.record_failed_login('test@umass.edu');
SELECT public.record_failed_login('test@umass.edu');
SELECT public.record_failed_login('test@umass.edu');

-- Check if blocked (should be true now)
SELECT public.check_bruteforce('test@umass.edu');
-- Should return: true

-- Reset attempts
SELECT public.reset_failed_login('test@umass.edu');

-- Check again (should be false)
SELECT public.check_bruteforce('test@umass.edu');
-- Should return: false
```

## Troubleshooting

### "Function does not exist" Error

**Problem**: Frontend can't call database functions.

**Solution**: 
1. Make sure you ran `database/brute_force_protection.sql` in Supabase SQL Editor
2. Check that functions exist in Supabase Dashboard → Database → Functions
3. Verify function names match exactly: `record_failed_login`, `check_bruteforce`, `reset_failed_login`

### "Permission denied" Error

**Problem**: Functions don't have proper permissions.

**Solution**: 
1. Make sure functions use `SECURITY DEFINER`
2. Verify grants in the SQL script: `GRANT EXECUTE ON FUNCTION ... TO authenticated;`
3. Check RLS policies (functions should bypass RLS with `SECURITY DEFINER`)

### Notifications Not Showing

**Problem**: Notification component not displaying.

**Solution**:
1. Check browser console for errors
2. Verify `Notification` component is imported correctly
3. Check that `useNotification` hook is used in `Signin.jsx`
4. Verify CSS animations are loaded (`animate-slide-in` in `src/index.css`)

### Protection Not Working

**Problem**: Login attempts not being blocked.

**Solution**:
1. Check browser console for errors when calling database functions
2. Verify `checkBruteForce()` is called before login attempt
3. Check `failed_logins` table in Supabase to see if records are being created
4. Verify function logic: `check_bruteforce()` should return `true` for 6+ attempts

## Maintenance

### Cleanup Old Records

The `cleanup_old_failed_logins()` function removes records older than 24 hours. You can:

1. **Run manually** in Supabase SQL Editor:
   ```sql
   SELECT public.cleanup_old_failed_logins();
   ```

2. **Set up a cron job** (if using Supabase Edge Functions or external scheduler):
   - Schedule to run daily
   - Calls `cleanup_old_failed_logins()` function

### Monitor Failed Logins

You can monitor failed login attempts by querying the `failed_logins` table:

```sql
-- View all failed login records
SELECT * FROM public.failed_logins ORDER BY last_attempt DESC;

-- View currently blocked emails
SELECT email, attempts, last_attempt
FROM public.failed_logins
WHERE NOW() - last_attempt < INTERVAL '15 minutes'
  AND attempts >= 6;
```

## Security Notes

1. **Fail Open**: If database functions fail, the system allows login (fail open) to prevent locking out legitimate users
2. **Case Insensitive**: Email addresses are normalized to lowercase before checking
3. **Time-based Reset**: Blocks automatically expire after 15 minutes
4. **Successful Login Reset**: Successful login immediately clears failed attempts

## Customization

### Change Block Threshold

To change from 6 attempts to a different number:

1. Update `check_bruteforce()` function in `database/brute_force_protection.sql`:
   ```sql
   RETURN COALESCE(tries >= 5, false); -- Change 6 to 5
   ```

2. Re-run the SQL script to update the function

### Change Time Window

To change from 15 minutes to a different duration:

1. Update `check_bruteforce()` function:
   ```sql
   AND NOW() - last_attempt < INTERVAL '30 minutes'; -- Change 15 to 30
   ```

2. Update the error message in `src/context/AuthContext.jsx`:
   ```javascript
   error: "Too many failed login attempts. Please try again in 30 minutes."
   ```

3. Re-run the SQL script and update the frontend code

