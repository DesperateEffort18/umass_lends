# Fix: Blank Page Issue

## 🐛 Problem

The page is blank because **environment variables are missing** for Vite.

## ✅ Solution

### Step 1: Add Missing Environment Variables

Your `.env` file has:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (for Next.js backend)
- ❌ `VITE_SUPABASE_URL` (MISSING - needed for Vite frontend)
- ❌ `VITE_SUPABASE_ANON_KEY` (MISSING - needed for Vite frontend)

### Step 2: Update .env File

Add these lines to your `.env` file (use the SAME values as NEXT_PUBLIC_ ones):

```env
# Existing (for Next.js backend)
NEXT_PUBLIC_SUPABASE_URL=https://dtafbloenfczcjzllizs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development

# ADD THESE (for Vite frontend - same values!)
VITE_SUPABASE_URL=https://dtafbloenfczcjzllizs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0YWZibG9lbmZjemNqemxsaXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Njc0NDQsImV4cCI6MjA3ODE0MzQ0NH0._Fk5_JE7oXPBl2PegghVOKe5LMEI_k1OeqthR8Garuw
```

### Step 3: Restart Vite Server

**Important**: After adding environment variables, you MUST restart the Vite server!

1. **Stop the server** (Ctrl+C in the terminal)
2. **Start it again**: `npm run dev:frontend`

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see errors if env variables are still missing
4. The error will tell you exactly what's wrong

---

## 🔍 Why This Happens

- **Next.js** uses `NEXT_PUBLIC_` prefix for environment variables
- **Vite** uses `VITE_` prefix for environment variables
- They need to be set separately, even though they have the same values

---

## ✅ Quick Fix

1. **Open `.env` file**
2. **Add these lines** (copy the values from NEXT_PUBLIC_ ones):
   ```env
   VITE_SUPABASE_URL=https://dtafbloenfczcjzllizs.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0YWZibG9lbmZjemNqemxsaXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Njc0NDQsImV4cCI6MjA3ODE0MzQ0NH0._Fk5_JE7oXPBl2PegghVOKe5LMEI_k1OeqthR8Garuw
   ```
3. **Save the file**
4. **Restart Vite server**: Stop and run `npm run dev:frontend` again
5. **Refresh browser**

---

## 🧪 Verify It's Working

After adding the env variables and restarting:

1. **Check browser console** (F12) - should have no errors
2. **Page should load** - you should see "UMass Lends Login" heading
3. **Can navigate** - try going to `/signin` or `/signup`

---

## 💡 Pro Tip

If you still see a blank page after adding env variables:

1. **Hard refresh browser**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Check console** for specific error messages
4. **Verify env variables** are actually loaded:
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_SUPABASE_URL);
   ```
   Should show your Supabase URL, not `undefined`

