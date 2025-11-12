# 🔧 Fix Netlify Configuration Error

## ❌ Error

```
Configuration property plugins must be an array of objects.

Invalid syntax
  [plugins]
```

## ✅ Fix Applied

I've fixed the `netlify.toml` file by removing the invalid `[plugins]` section. Since we don't need any plugins, we don't need to declare them.

## 📋 Next Steps

### Step 1: Commit and Push the Fix

```bash
git add netlify.toml
git commit -m "Fix netlify.toml: Remove invalid plugins section"
git push
```

### Step 2: Verify Next.js Runtime is Removed

1. Go to Netlify Dashboard → Your Site → Site settings
2. Go to **Build & deploy** → **Runtime** (or **Plugins**)
3. Make sure **Next.js** runtime is **removed** (clicked "Remove" button)
4. If it's still there, click **"Remove"** again

### Step 3: Verify Build Settings

1. Go to **Build & deploy** → **Build settings**
2. Click **"Edit settings"**
3. Verify:
   - **Build command:** `npm run build:frontend`
   - **Publish directory:** `dist`
   - **Framework:** None (or Other)
   - **Auto-detect framework:** OFF
4. **Save** changes

### Step 4: Set Environment Variables

1. Go to **Build & deploy** → **Environment variables**
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   **⚠️ Replace with your actual backend URL!**

### Step 5: Deploy

1. Go to **Deploys** tab
2. Click **"Clear cache and deploy site"**
3. Wait for build to complete

## ✅ Expected Result

After the fix, the build should:
1. ✅ Parse `netlify.toml` successfully (no syntax errors)
2. ✅ Run `npm run build:frontend` command
3. ✅ Build Vite frontend successfully
4. ✅ Deploy to `dist` directory
5. ✅ No Next.js plugin errors

## 🎯 What Was Fixed

**Before (Invalid):**
```toml
[plugins]
```

**After (Fixed):**
```toml
# No plugins - we're building a Vite app, not Next.js
# The Next.js runtime/plugin must be removed in Netlify UI settings
# We don't need to declare plugins here if we're not using any
```

## ✅ Checklist

- [ ] `netlify.toml` is fixed (invalid `[plugins]` section removed)
- [ ] Changes committed and pushed to repository
- [ ] Next.js runtime is removed in Netlify UI
- [ ] Build settings are correct (command: `npm run build:frontend`, directory: `dist`)
- [ ] Framework is set to None
- [ ] Environment variables are set
- [ ] Cache cleared
- [ ] New deploy triggered
- [ ] Build succeeds without errors

## 🎉 Success!

Once you've committed the fix and redeployed, the build should work correctly!

---

**Quick Fix:** Just commit and push the fixed `netlify.toml` file, then trigger a new deploy in Netlify.

