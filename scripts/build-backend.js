/**
 * Build script for Next.js backend only
 * Temporarily renames src/ directory to prevent Next.js from processing React Router pages
 * This is needed because Next.js tries to pre-render all React components it finds,
 * and React Router pages use hooks that require a Router context
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const srcPath = path.join(projectRoot, 'src');
const srcBackupPath = path.join(projectRoot, 'src.backup.tmp');
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
const viteConfigBackupPath = path.join(projectRoot, 'vite.config.js.backup.tmp');
const indexHtmlPath = path.join(projectRoot, 'index.html');
const indexHtmlBackupPath = path.join(projectRoot, 'index.html.backup.tmp');

console.log('🔧 Preparing backend-only build for Vercel...');

let srcRenamed = false;
let viteConfigRenamed = false;
let indexHtmlRenamed = false;

function cleanup() {
  // Restore files in reverse order
  if (indexHtmlRenamed && fs.existsSync(indexHtmlBackupPath)) {
    console.log('🔄 Restoring index.html...');
    if (fs.existsSync(indexHtmlPath)) {
      fs.unlinkSync(indexHtmlPath);
    }
    fs.renameSync(indexHtmlBackupPath, indexHtmlPath);
  }
  
  if (viteConfigRenamed && fs.existsSync(viteConfigBackupPath)) {
    console.log('🔄 Restoring vite.config.js...');
    if (fs.existsSync(viteConfigPath)) {
      fs.unlinkSync(viteConfigPath);
    }
    fs.renameSync(viteConfigBackupPath, viteConfigPath);
  }
  
  if (srcRenamed && fs.existsSync(srcBackupPath)) {
    console.log('🔄 Restoring src/ directory...');
    if (fs.existsSync(srcPath)) {
      fs.rmSync(srcPath, { recursive: true, force: true });
    }
    fs.renameSync(srcBackupPath, srcPath);
    console.log('✅ src/ directory restored');
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught error:', error);
  cleanup();
  process.exit(1);
});

try {
  // Temporarily rename src directory to prevent Next.js from processing it
  if (fs.existsSync(srcPath)) {
    console.log('📦 Temporarily renaming src/ directory...');
    if (fs.existsSync(srcBackupPath)) {
      fs.rmSync(srcBackupPath, { recursive: true, force: true });
    }
    fs.renameSync(srcPath, srcBackupPath);
    srcRenamed = true;
    console.log('✅ src/ directory renamed to src.backup.tmp/');
  }

  // Also rename Vite-specific files that might confuse Next.js
  if (fs.existsSync(viteConfigPath)) {
    console.log('📦 Temporarily renaming vite.config.js...');
    fs.renameSync(viteConfigPath, viteConfigBackupPath);
    viteConfigRenamed = true;
  }

  if (fs.existsSync(indexHtmlPath)) {
    console.log('📦 Temporarily renaming index.html...');
    fs.renameSync(indexHtmlPath, indexHtmlBackupPath);
    indexHtmlRenamed = true;
  }

  // Run Next.js build (only processes app/ directory)
  console.log('🏗️  Building Next.js backend (API routes only)...');
  execSync('next build', { 
    stdio: 'inherit', 
    cwd: projectRoot,
    env: { ...process.env }
  });
  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  throw error; // Re-throw to trigger cleanup
} finally {
  // Always cleanup, even if build fails
  cleanup();
}

