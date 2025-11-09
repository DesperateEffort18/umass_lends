# Vercel Deployment Guide

## Important: Build Configuration

This project uses a **custom build script** that temporarily hides the `src/` directory (Vite frontend) during Next.js build to prevent React Router conflicts. The build script automatically:

1. Temporarily renames `src/` directory
2. Runs Next.js build (API routes only)
3. Restores `src/` directory after build

The build script is configured in `package.json` as the `build` command, so Vercel will use it automatically.

## Environment Variables Setup

To fix the build error on Vercel, you need to set the following environment variables in your Vercel project settings:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Get it from: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Get it from: Supabase Dashboard → Settings → API → anon public key

3. **SUPABASE_SERVICE_ROLE_KEY** (for backend API routes)
   - Your Supabase service role key (keep this secret!)
   - Get it from: Supabase Dashboard → Settings → API → service_role key

### Optional Environment Variables

4. **VITE_SUPABASE_URL** (for Vite frontend, if deploying separately)
   - Same value as NEXT_PUBLIC_SUPABASE_URL

5. **VITE_SUPABASE_ANON_KEY** (for Vite frontend, if deploying separately)
   - Same value as NEXT_PUBLIC_SUPABASE_ANON_KEY

6. **VITE_API_URL** (for Vite frontend)
   - Your deployed API URL (e.g., `https://your-project.vercel.app`)

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Click on **Environment Variables**
4. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase URL
   - **Environment**: Select all (Production, Preview, Development)
5. Repeat for all required variables
6. **Redeploy** your project after adding variables

## Project Structure

This project has a hybrid setup:
- **Next.js Backend**: API routes in `app/api/` (deployed on Vercel)
- **Vite Frontend**: React app in `src/` (can be deployed separately or served statically)

## Build Configuration

The `next.config.js` has been configured to:
- Handle both Vite and Next.js environment variable syntax
- Support the hybrid frontend/backend setup
- Provide fallback values during build to prevent errors

## Troubleshooting

### Build Error: "useNavigate() may be used only in the context of a <Router> component"

**This is the main issue you're experiencing!**

**Cause**: Next.js is trying to pre-render React Router pages from `src/pages/` during build, but these pages use `useNavigate()` which requires a Router context that doesn't exist during static generation.

**Solution**: The custom build script (`scripts/build-backend.js`) automatically fixes this by:
1. Temporarily renaming the `src/` directory during build (so Next.js can't see it)
2. Running Next.js build (which only processes API routes in `app/api/`)
3. Restoring the `src/` directory after build

**To verify the fix is working**:
- Check that `package.json` has `"build": "node scripts/build-backend.js"`
- The build script should automatically run when Vercel builds your project
- You should see log messages like "Temporarily renaming src/ directory..." during build

### Build Error: "Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')"

**Solution**: Make sure you've set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.

### Build Error: "Missing Supabase environment variables"

**Solution**: 
1. Check that all required environment variables are set in Vercel
2. Make sure you've selected the correct environment (Production, Preview, Development)
3. Redeploy after adding variables

### API Calls Failing

**Solution**: Make sure `VITE_API_URL` is set to your deployed Vercel URL (e.g., `https://your-project.vercel.app`)

## Notes

- The code has been updated to work in both Vite and Next.js environments
- Environment variables prefixed with `NEXT_PUBLIC_` are available to both server and client in Next.js
- Environment variables prefixed with `VITE_` are only available in Vite builds
- The build process now uses fallback values to prevent build errors if env vars are missing

