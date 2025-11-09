# 🚀 Quick Setup Guide

## 1. About the Recommendation System (No API Key Needed!)

**Good news**: The recommendation system I built does **NOT** use any external LLM or AI API. It's a **rule-based system** that:
- Uses keyword matching (like "calculator", "screwdriver")
- Matches items to time periods based on the current date
- No API keys, no external services, no costs!

It's completely self-contained and works offline once your app is running.

---

## 2. Getting Your Website Running

### Step 1: Install Dependencies (if not already done)

```bash
cd /Users/kjagan/umass_lends
npm install
```

This installs all the packages your project needs (React, Next.js, Supabase, etc.)

### Step 2: Set Up Environment Variables

You need to create a `.env` file in the root directory with your Supabase credentials:

```bash
# Create .env file
touch .env
```

Then add these variables to `.env`:

```env
# Supabase Configuration (for Next.js backend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Configuration (for Vite frontend - same values, different prefix)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API URL (optional - defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000
```

**Where to get these values:**
1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 3: Run Both Servers

You need **TWO terminals** running:

**Terminal 1 - Backend (Next.js):**
```bash
npm run dev:backend
```
Wait for: `✓ Ready in Xs` and `- Local: http://localhost:3000`

**Terminal 2 - Frontend (Vite):**
```bash
npm run dev:frontend
```
Wait for: `Local: http://localhost:5173` (or similar port)

### Step 4: Open Your Browser

Go to: `http://localhost:5173` (or whatever port Vite shows)

---

## 3. Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "Port already in use"
- Backend: Change port with `npm run dev:backend -- -p 3001`
- Frontend: Vite will auto-use next available port

### "Failed to fetch" or API errors
- Make sure backend is running on port 3000
- Check `.env` file has correct Supabase credentials
- Restart both servers after changing `.env`

### Blank page
- Check browser console (F12) for errors
- Make sure both servers are running
- Check that routes are correct

### "VITE_SUPABASE_URL is not defined"
- Make sure `.env` file exists in root directory
- Make sure variable names start with `VITE_` for frontend
- Restart frontend server after adding env variables

---

## 4. What You Need to Download

✅ **Already installed** (if `node_modules` exists):
- Node.js packages (via `npm install`)

❌ **You DON'T need to download:**
- Any LLM/AI API keys
- External services
- Additional software

✅ **You DO need:**
- Node.js installed (check with `node --version`)
- npm installed (check with `npm --version`)
- A Supabase account and project
- Your Supabase credentials in `.env` file

---

## 5. Quick Test

1. **Start backend**: `npm run dev:backend`
2. **Start frontend**: `npm run dev:frontend` (in another terminal)
3. **Open browser**: `http://localhost:5173`
4. **You should see**: The home page with items (if any exist)

---

## 6. Next Steps

Once it's running:
1. Sign up/Sign in at `/signup` or `/signin`
2. Create some items at `/items/new`
3. Browse items on the home page
4. See recommendations appear based on the current date!

---

## Summary

- ❌ **No LLM/API keys needed** - it's a rule-based system
- ✅ **Install dependencies**: `npm install`
- ✅ **Set up `.env`** with Supabase credentials
- ✅ **Run two servers**: backend + frontend
- ✅ **Open browser** to `http://localhost:5173`

That's it! 🎉

