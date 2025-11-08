# Fix: CORS and Foreign Key Issues

## 🐛 Problems

1. **CORS Error**: "No 'Access-Control-Allow-Origin' header"
2. **Foreign Key Error**: "violates foreign key constraint 'fk_sender'"

## ✅ Solutions Applied

### 1. CORS Headers Added to All Routes

I've added CORS headers to ALL API routes. **You need to restart your backend** for this to take effect.

### 2. User Auto-Creation

I've created a helper function that automatically creates a user record in the `users` table when they sign in via Supabase Auth. This fixes the foreign key constraint error.

---

## 🚀 Steps to Fix

### Step 1: Restart Backend Server

**IMPORTANT**: You MUST restart the backend for CORS headers to work!

1. **Stop the backend** (Ctrl+C in the terminal running `npm run dev:backend`)
2. **Start it again**:
   ```bash
   npm run dev:backend
   ```

### Step 2: Test Again

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
2. **Go to dashboard**: `http://localhost:5174/dashboard`
3. **Click test buttons** - they should work now!

---

## 🔍 What Was Fixed

### CORS Headers

Added to all API routes:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- OPTIONS handler for preflight requests

### User Auto-Creation

Created `lib/ensureUser.ts` that:
- Checks if user exists in `users` table
- Creates user record if it doesn't exist
- Called automatically when `getUser()` is used

This ensures Supabase Auth users automatically get a record in the `users` table, fixing foreign key constraints.

---

## ✅ Verification

After restarting backend:

1. **Test in browser console**:
   ```javascript
   fetch('http://localhost:3000/api/items')
     .then(r => r.json())
     .then(console.log);
   ```
   Should work without CORS error.

2. **Test API buttons** in dashboard - should work now!

3. **Check Network tab** (F12 → Network):
   - Requests should have status 200/201/401 (not "failed")
   - Response headers should include `Access-Control-Allow-Origin`

---

## 🐛 If Still Not Working

### Check 1: Backend is Running

```bash
# Test if backend is accessible
curl http://localhost:3000/api/items
```

Should return JSON, not connection error.

### Check 2: CORS Headers Present

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click on a request
4. Check Response Headers
5. Should see: `Access-Control-Allow-Origin: *`

### Check 3: Backend Was Restarted

- Make sure you stopped and restarted the backend
- CORS headers are only applied after restart

---

## 💡 Quick Fix Summary

1. **Restart backend**: `npm run dev:backend` (stop and start)
2. **Refresh browser**: Ctrl+Shift+R
3. **Test again**: Click buttons in dashboard

The user auto-creation will happen automatically when you make API calls - no manual steps needed!

