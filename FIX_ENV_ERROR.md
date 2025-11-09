# 🔧 Fix: Missing Supabase Environment Variables Error

## The Error

```
Missing Supabase environment variables. Please check your .env file.
```

This error occurs because your `.env` file is missing or doesn't have the required Supabase credentials.

---

## ✅ Quick Fix (Choose One Method)

### Method 1: Use the Helper Script (Easiest)

```bash
node scripts/create-env.js
```

This will guide you through entering your Supabase credentials interactively.

---

### Method 2: Create .env File Manually

1. **Create the `.env` file** in the root directory:
   ```bash
   touch .env
   ```

2. **Open the `.env` file** and add these variables:

   ```env
   # Supabase Configuration (for Next.js backend)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Supabase Configuration (for Vite frontend - use SAME values)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # API URL (optional)
   VITE_API_URL=http://localhost:3000
   ```

3. **Replace the placeholder values** with your actual Supabase credentials:
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to: **Settings → API**
   - Copy:
     - **Project URL** → Use for both `NEXT_PUBLIC_SUPABASE_URL` and `VITE_SUPABASE_URL`
     - **anon public** key → Use for both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
     - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

---

## 🔄 After Creating .env File

**IMPORTANT**: You MUST restart your servers for the changes to take effect!

1. **Stop your backend server** (if running):
   - Press `Ctrl+C` in the terminal running `npm run dev:backend`

2. **Stop your frontend server** (if running):
   - Press `Ctrl+C` in the terminal running `npm run dev:frontend`

3. **Start them again**:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend (new terminal)
   npm run dev:frontend
   ```

---

## ✅ Verify It's Working

After restarting, you should:
- ✅ No more "Missing Supabase environment variables" error
- ✅ Backend starts successfully
- ✅ Frontend connects to Supabase
- ✅ You can sign in/sign up

---

## 🐛 Still Getting the Error?

1. **Check `.env` file exists**:
   ```bash
   ls -la .env
   ```

2. **Check variable names are correct**:
   - Must be exactly: `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
   - Must be exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)

3. **Check no extra spaces**:
   ```env
   # ✅ Correct
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   
   # ❌ Wrong (has spaces)
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   ```

4. **Check you restarted servers**:
   - Environment variables are only read when servers start
   - You MUST restart after creating/changing `.env`

5. **Check `.env` is in root directory**:
   - Should be: `/Users/kjagan/umass_lends/.env`
   - Not in: `src/.env` or `app/.env`

---

## 📝 Example .env File

Here's what a complete `.env` file should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

VITE_API_URL=http://localhost:3000
```

---

## 🎯 Quick Checklist

- [ ] `.env` file exists in root directory
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `VITE_SUPABASE_URL` is set (same as above)
- [ ] `VITE_SUPABASE_ANON_KEY` is set (same as above)
- [ ] No extra spaces around `=`
- [ ] Servers restarted after creating `.env`

---

That's it! Once you create the `.env` file with your Supabase credentials and restart your servers, the error should be gone! 🎉

