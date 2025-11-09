# Testing Reporting Feature with Multiple Users

This guide explains how to test the reporting functionality with multiple users running the frontend and backend locally.

## Prerequisites

1. **Same Supabase Database**: Both users must be connected to the same Supabase project (same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
2. **Same Backend API URL**: Both users must point to the same backend API (same `VITE_API_URL`)
3. **Network Access**: Users need to be able to access each other's backend API

## Setup Options

### Option 1: Same Network (Local Network)

If both users are on the same local network (e.g., same WiFi):

1. **User 1 (Backend Host)**:
   - Run backend: `npm run dev` (usually on `http://localhost:3000`)
   - Find your local IP address:
     - **Windows**: Open PowerShell and run `ipconfig`, look for "IPv4 Address" (e.g., `192.168.1.100`)
     - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your local IP
   - Share your local IP address with User 2

2. **User 2**:
   - Update `.env` file to point to User 1's backend:
     ```env
     VITE_API_URL=http://192.168.1.100:3000
     ```
   - Run frontend: `npm run dev:frontend` (usually on `http://localhost:5173`)

3. **User 1**:
   - Update `.env` file to use localhost:
     ```env
     VITE_API_URL=http://localhost:3000
     ```
   - Run frontend: `npm run dev:frontend`

### Option 2: Same Machine (Different Browsers/Incognito)

If testing on the same machine:

1. **User 1**:
   - Run backend: `npm run dev`
   - Run frontend: `npm run dev:frontend`
   - Use regular browser window
   - Sign in with account 1

2. **User 2**:
   - Use incognito/private window or different browser
   - Navigate to `http://localhost:5173`
   - Sign in with account 2

### Option 3: Deployed Backend (Recommended for Testing)

Deploy the backend to a service (Vercel, Railway, etc.) and both users connect to it:

1. **Deploy Backend**:
   - Deploy Next.js backend to Vercel or similar
   - Get the deployed URL (e.g., `https://your-backend.vercel.app`)

2. **Both Users**:
   - Update `.env` file:
     ```env
     VITE_API_URL=https://your-backend.vercel.app
     ```
   - Run frontend locally: `npm run dev:frontend`

## Testing Steps

### Step 1: Create Test Accounts

1. **User 1**: Sign up with email `test1@umass.edu`
2. **User 2**: Sign up with email `test2@umass.edu`
3. **User 3** (optional): Sign up with email `test3@umass.edu`

### Step 2: Create a Test Item

1. **User 1**: 
   - Sign in with `test1@umass.edu`
   - Create an item (e.g., "Test Calculator")
   - Note the item ID or title

### Step 3: Test Reporting

1. **User 2**:
   - Sign in with `test2@umass.edu`
   - Navigate to the item created by User 1
   - Click "Report Item"
   - Select a reason (e.g., "Scam")
   - Submit the report
   - ✅ Should see: "Report submitted successfully!"

2. **User 3, 4, 5** (continue reporting):
   - Sign in with different accounts (`test3@umass.edu`, `test4@umass.edu`, `test5@umass.edu`)
   - Navigate to the same item
   - Click "Report Item"
   - Select the **same reason** as previous reports (e.g., "Scam")
   - Submit the report
   - After the 5th report with the same reason:
     - ✅ Should see: "Report submitted successfully!"
     - ✅ Should see: "This item has been automatically deleted due to multiple reports."
     - ✅ Item should disappear from the list

### Step 4: Verify Deletion

1. **User 1**:
   - Refresh the page or navigate to "My Items"
   - ✅ Item should no longer appear in the list

2. **User 2**:
   - Try to navigate to the item URL directly
   - ✅ Should see "Item not found" or be redirected

3. **Check Database** (Optional):
   - Go to Supabase Dashboard → Table Editor → `items`
   - ✅ Item should be deleted from the database
   - Go to Supabase Dashboard → Table Editor → `item_reports`
   - ✅ Reports should still exist (they cascade delete when item is deleted)

## Testing Checklist

- [ ] User 1 creates an item
- [ ] User 2 reports the item (1st report)
- [ ] Item is still visible after 1st report
- [ ] User 3 reports the same item with the **same reason** (2nd report)
- [ ] Item is still visible after 2nd report
- [ ] User 4 reports the same item with the **same reason** (3rd report)
- [ ] Item is still visible after 3rd report
- [ ] User 5 reports the same item with the **same reason** (4th report)
- [ ] Item is still visible after 4th report
- [ ] User 6 reports the same item with the **same reason** (5th report)
- [ ] Item is automatically deleted after 5th report
- [ ] User 1 sees item removed from "My Items"
- [ ] User 2 cannot access the item anymore
- [ ] Image is deleted from Supabase Storage (check Storage dashboard)
- [ ] Related records are cascade deleted (borrow_requests, messages)

## Troubleshooting

### "Failed to fetch" Error

**Problem**: User 2 can't connect to User 1's backend.

**Solutions**:
1. Check firewall settings (Windows Firewall, macOS Firewall)
2. Verify both users are on the same network
3. Check that backend is running on the correct port
4. Try using the deployed backend option instead

### "CORS Error"

**Problem**: Browser blocks requests due to CORS.

**Solution**: 
- Make sure backend has CORS headers (already implemented in `lib/cors.ts`)
- Check that `VITE_API_URL` matches the backend URL exactly

### "Item Not Deleted"

**Problem**: Item still exists after 5 reports.

**Solutions**:
1. Check that all 5 reports have the **same reason** (reports with different reasons don't count together)
2. Verify the database trigger function is updated:
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name = 'check_and_remove_reported_items';
   ```
3. Check Supabase logs for trigger errors
4. Verify the API route is being called (check browser Network tab)

### "Image Not Deleted"

**Problem**: Item is deleted but image remains in storage.

**Solutions**:
1. Check Supabase Storage dashboard → `item-images` bucket
2. Verify image deletion code in API route is executing
3. Check browser console for storage deletion errors
4. Manually delete the image from storage if needed

## Advanced Testing

### Test with Different Reasons

1. User 2 reports item with reason "Scam"
2. User 3 reports item with reason "Violence or Hate"
3. ✅ Item should **NOT** be deleted (different reasons don't count together)
4. User 3 reports again with reason "Scam" (same as User 2)
5. User 4 reports item with reason "Scam"
6. User 5 reports item with reason "Scam"
7. User 6 reports item with reason "Scam"
8. ✅ Item should be deleted (now 5 reports for "Scam")

### Test Cascade Deletion

1. User 1 creates item
2. User 2 requests to borrow the item
3. User 1 approves the request
4. User 2 and User 3 report the item (same reason)
5. ✅ Item is deleted
6. ✅ Borrow request is also deleted (cascade)
7. ✅ Messages are also deleted (cascade)

### Test Duplicate Reports

1. User 2 reports item with reason "Scam"
2. User 2 tries to report the same item with reason "Scam" again
3. ✅ Should see error: "You have already reported this item for this reason"
4. ✅ Item should NOT be deleted (only 1 unique report)

## Network Configuration

### Windows Firewall

If User 2 can't connect to User 1's backend:

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Firewall"
3. Add Node.js or allow port 3000

### macOS Firewall

1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Allow Node.js or allow incoming connections on port 3000

### Find Your Local IP

**Windows**:
```powershell
ipconfig
# Look for "IPv4 Address" under your network adapter
```

**Mac/Linux**:
```bash
ifconfig
# or
ip addr
# Look for your local IP (usually 192.168.x.x or 10.x.x.x)
```

## Quick Test Script

You can also test programmatically using the browser console:

```javascript
// In User 2's browser console (on the item page)
// Replace ITEM_ID with the actual item ID
const itemId = 'YOUR_ITEM_ID_HERE';

// Report the item
fetch(`${import.meta.env.VITE_API_URL}/api/items/${itemId}/report`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  },
  body: JSON.stringify({ reason: 'scam' })
})
.then(r => r.json())
.then(data => console.log('Report result:', data));
```

## Expected Behavior

### After 1 Report:
- ✅ Report is created in database
- ✅ Item is still visible
- ✅ Item is still available

### After 5 Reports (Same Reason):
- ✅ Item is deleted from database
- ✅ Image is deleted from storage
- ✅ Borrow requests are cascade deleted
- ✅ Messages are cascade deleted
- ✅ Item reports are cascade deleted
- ✅ Users see warning message
- ✅ Item disappears from all views

## Notes

- **Same Reason Required**: Reports must have the **same reason** to count together (e.g., both "Scam")
- **Different Reasons Don't Count**: "Scam" + "Violence" = 2 separate counts, not combined
- **Cascade Deletion**: When an item is deleted, all related records are automatically deleted
- **Image Storage**: Images are deleted from Supabase Storage when item is deleted
- **Database Trigger**: The trigger function runs automatically when a report is inserted

