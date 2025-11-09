# Fix: Display User Names Instead of UUIDs

## ✅ What Was Fixed

I've updated the API and frontend to display user names and emails instead of UUIDs.

## 🔧 Changes Made

### 1. Updated Borrow Requests API (`app/api/borrow/mine/route.ts`)
- Fetches user information for all borrowers and owners
- Returns `borrower_name`, `borrower_email`, `owner_name`, and `owner_email` with each request
- Falls back to email if name is not available
- Falls back to "Unknown User" if neither is available

### 2. Updated Messages API (`app/api/messages/route.ts`)
- Fetches user information for all message senders
- Returns `sender_name` and `sender_email` with each message
- Falls back to email if name is not available

### 3. Updated Frontend Components
- **MyItems.jsx**: Shows borrower name/email instead of UUID
- **BorrowRequests.jsx**: Shows borrower and owner names
- **ItemDetail.jsx**: Shows sender name in messages

## 📋 How It Works

### API Flow
1. Fetch borrow requests or messages
2. Collect all unique user IDs
3. Fetch user information from `users` table
4. Map user info to each request/message
5. Return transformed data with names

### Display Logic
- **Priority 1**: User's name (from `users.name`)
- **Priority 2**: User's email (from `users.email`)
- **Priority 3**: "Unknown User" (fallback)

## 🚀 Testing

1. **Restart backend** (if needed):
   ```bash
   npm run dev:backend
   ```

2. **Test borrow requests**:
   - Go to `/my-items` or `/borrow-requests`
   - Should see names/emails instead of UUIDs

3. **Test messages**:
   - Go to an item detail page
   - Send/receive messages
   - Should see sender names

## 💡 Note

User names are stored in the `users` table. When a user signs up:
- Their Supabase Auth user ID is used
- A record is created in the `users` table via `ensureUser()`
- The `name` field is populated from `user_metadata.name` or email prefix
- The `email` field is populated from Supabase Auth email

If you see "Unknown User", it means:
- The user record doesn't exist in the `users` table
- Or the user doesn't have a name or email set

## 🔍 Troubleshooting

### Still seeing UUIDs?
1. **Check backend logs** - Look for errors fetching users
2. **Check database** - Verify users exist in `users` table
3. **Check API response** - Use browser DevTools to see API response
4. **Restart backend** - Make sure latest code is running

### "Unknown User" showing?
1. **Check users table** - Verify user has name or email
2. **Check ensureUser()** - Make sure it's creating user records
3. **Check API** - Verify user data is being fetched correctly

## ✅ Result

Now you should see:
- ✅ "Request from: John Doe" instead of "Request from: f16c1cbd-..."
- ✅ "Owner: jane@umass.edu" instead of "Owner: abc123-..."
- ✅ "You" or "John Doe" in messages instead of UUIDs

