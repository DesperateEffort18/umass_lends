# CORS Fix for Browser Testing

## ✅ Fixed!

I've added CORS (Cross-Origin Resource Sharing) headers to the messages API route. This allows your browser to make requests to the API.

## What Was Fixed

1. Created `lib/cors.ts` - CORS helper functions
2. Added CORS headers to all responses in `/api/messages` route
3. Added OPTIONS handler for CORS preflight requests

## How to Test

1. **Restart your dev server** (if it's running):
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Open the browser test page**:
   - Open `examples/test-realtime-browser.html` in your browser
   - Or serve it: `npx http-server examples/` then open http://localhost:8080/test-realtime-browser.html

3. **Fill in the configuration**:
   - Supabase URL (from your .env file)
   - Supabase Anon Key (from your .env file)
   - Item ID (use one of your items)
   - API Base URL: `http://localhost:3000`

4. **Click "Connect to Realtime"**

5. **Send a message** - it should work now!

## Troubleshooting

### Still getting "Failed to fetch"?

1. **Check if dev server is running**:
   ```bash
   # Visit in browser:
   http://localhost:3000/api/items
   ```
   Should return JSON with your items.

2. **Check browser console** (F12):
   - Look for any error messages
   - Check Network tab to see the actual request

3. **Verify API URL**:
   - Make sure it's `http://localhost:3000` (not `https://`)
   - Make sure the dev server is actually running

4. **Check CORS headers**:
   - Open browser DevTools → Network tab
   - Send a message
   - Click on the request
   - Check Response Headers
   - Should see: `Access-Control-Allow-Origin: *`

### Alternative: Use the Node.js Script

If browser testing still doesn't work, use the automated script:

```bash
node scripts/test-realtime-messaging.js
```

This doesn't have CORS issues since it runs in Node.js, not the browser.

## What CORS Does

CORS allows web pages to make requests to APIs on different origins (domains/ports). Without CORS headers, browsers block these requests for security.

The fix adds these headers to all API responses:
- `Access-Control-Allow-Origin: *` - Allows any origin
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

