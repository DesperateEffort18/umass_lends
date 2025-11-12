# 🔧 Fix Node.js Version Error

## ❌ Error

```
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+.
```

## ✅ Fixes Applied

I've made three changes to ensure Netlify uses Node.js 20:

1. ✅ Updated `netlify.toml` - Set `NODE_VERSION = "20"`
2. ✅ Created `.nvmrc` file - Contains `20` (Netlify auto-detects this)
3. ✅ Updated `package.json` - Added `engines` field requiring Node >=20.19.0

## 📋 Next Steps

### Step 1: Commit and Push Changes

```bash
git add netlify.toml .nvmrc package.json
git commit -m "Update Node.js version to 20 for Vite 7.2.2 compatibility"
git push
```

### Step 2: Set Node Version in Netlify UI (Important!)

Even though we set it in `netlify.toml`, you should also set it in the Netlify UI:

1. Go to Netlify Dashboard → Your Site → Site settings
2. Go to **Build & deploy** → **Build settings**
3. Look for **Node version** or **Environment** section
4. Set **Node version** to **20** (or **20.x**)
5. **Save** changes

**Alternative:** If you don't see a Node version setting:
- Go to **Build & deploy** → **Environment variables**
- Add: `NODE_VERSION = 20`
- **Save**

### Step 3: Clear Cache and Deploy

1. Go to **Deploys** tab
2. Click **"Clear cache and deploy site"**
3. Wait for build to complete

## ✅ Expected Result

After the fix, the build should:
1. ✅ Use Node.js 20.x (not 18.x)
2. ✅ Run Vite 7.2.2 successfully
3. ✅ Build the frontend without errors
4. ✅ Deploy to `dist` directory

## 🐛 If It Still Uses Node 18

If Netlify still uses Node 18 after these changes:

1. **Check Netlify UI** - Make sure Node version is set to 20 in Build settings
2. **Clear cache** - Clear Netlify build cache
3. **Check .nvmrc** - Make sure `.nvmrc` file is committed (contains just `20`)
4. **Check package.json** - Make sure `engines` field is present
5. **Redeploy** - Trigger a new deploy

## 📝 Files Changed

- `netlify.toml` - Added `NODE_VERSION = "20"` in `[build.environment]`
- `.nvmrc` - Created with `20` (Netlify auto-detects this)
- `package.json` - Added `engines: { "node": ">=20.19.0" }`

## 🎯 Quick Summary

**The problem:** Vite 7.2.2 requires Node.js 20.19+ or 22.12+, but Netlify was using Node.js 18.20.8.

**The solution:** 
1. Set Node version to 20 in `netlify.toml`
2. Create `.nvmrc` file with `20`
3. Add `engines` field to `package.json`
4. Set Node version to 20 in Netlify UI (Build settings)
5. Clear cache and redeploy

---

**After committing and pushing, also set the Node version in Netlify UI to be sure!**

