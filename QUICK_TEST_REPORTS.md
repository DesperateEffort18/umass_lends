# Quick Test Guide: Reporting Feature

## Fast Setup (Same Network)

### User 1 (Backend Host)
1. Find your IP address:
   ```powershell
   # Windows PowerShell
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```
2. Run backend:
   ```bash
   npm run dev
   ```
3. Share your IP address with User 2

### User 2
1. Update `.env` file:
   ```env
   VITE_API_URL=http://192.168.1.100:3000
   # Replace 192.168.1.100 with User 1's IP
   ```
2. Run frontend:
   ```bash
   npm run dev:frontend
   ```

### User 1
1. Keep `.env` as:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
2. Run frontend:
   ```bash
   npm run dev:frontend
   ```

## Test Steps

1. **User 1**: Sign up → Create an item (e.g., "Test Item")
2. **User 2**: Sign up → Find the item → Report it (reason: "Scam")
3. **User 3**: Report the same item with **same reason** ("Scam")
4. **User 4**: Report the same item with **same reason** ("Scam")
5. **User 5**: Report the same item with **same reason** ("Scam")
6. ✅ **Item should be deleted automatically after 5th report**

## Verify

- ✅ Item disappears from User 1's "My Items"
- ✅ Item disappears from item list
- ✅ Cannot access item URL directly
- ✅ Warning message appears: "This item has been automatically deleted"

## Troubleshooting

**Can't connect?**
- Check firewall settings
- Verify both users on same network
- Try using deployed backend instead

**Item not deleted?**
- Make sure both reports have the **same reason**
- Check browser console for errors
- Verify database trigger is updated (run `database/update_report_to_delete.sql`)

