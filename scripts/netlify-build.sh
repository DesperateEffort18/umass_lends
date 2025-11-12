#!/bin/bash
# Netlify build script for Vite frontend
# Temporarily hides Next.js files to prevent auto-detection

set -e

echo "🔧 Preparing Vite frontend build for Netlify..."

# Hide Next.js files to prevent Netlify from auto-detecting Next.js
if [ -f "next.config.js" ]; then
  echo "📦 Temporarily renaming next.config.js..."
  mv next.config.js next.config.js.netlify-hide
fi

if [ -d "app" ]; then
  echo "📦 Temporarily renaming app/ directory..."
  mv app app.netlify-hide
fi

if [ -d "lib" ]; then
  echo "📦 Temporarily renaming lib/ directory..."
  mv lib lib.netlify-hide
fi

if [ -f "tsconfig.json" ]; then
  echo "📦 Temporarily renaming tsconfig.json..."
  mv tsconfig.json tsconfig.json.netlify-hide
fi

# Run Vite build
echo "🏗️  Building Vite frontend..."
npm run build:frontend

# Restore files
echo "🔄 Restoring Next.js files..."

if [ -f "next.config.js.netlify-hide" ]; then
  mv next.config.js.netlify-hide next.config.js
fi

if [ -d "app.netlify-hide" ]; then
  mv app.netlify-hide app
fi

if [ -d "lib.netlify-hide" ]; then
  mv lib.netlify-hide lib
fi

if [ -f "tsconfig.json.netlify-hide" ]; then
  mv tsconfig.json.netlify-hide tsconfig.json
fi

echo "✅ Build completed successfully!"

