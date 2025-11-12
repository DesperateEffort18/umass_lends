/**
 * Netlify build script for Vite frontend
 * Temporarily hides Next.js files to prevent Netlify from auto-detecting Next.js
 * This prevents the @netlify/plugin-nextjs from running
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const nextConfigPath = path.join(projectRoot, 'next.config.js');
const nextConfigBackup = path.join(projectRoot, 'next.config.js.netlify-hide');
const appPath = path.join(projectRoot, 'app');
const appBackup = path.join(projectRoot, 'app.netlify-hide');
const libPath = path.join(projectRoot, 'lib');
const libBackup = path.join(projectRoot, 'lib.netlify-hide');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
const tsconfigBackup = path.join(projectRoot, 'tsconfig.json.netlify-hide');
const vercelJsonPath = path.join(projectRoot, 'vercel.json');
const vercelJsonBackup = path.join(projectRoot, 'vercel.json.netlify-hide');
const nextEnvPath = path.join(projectRoot, 'next-env.d.ts');
const nextEnvBackup = path.join(projectRoot, 'next-env.d.ts.netlify-hide');

console.log('🔧 Preparing Vite frontend build for Netlify...');

let nextConfigRenamed = false;
let appRenamed = false;
let libRenamed = false;
let tsconfigRenamed = false;
let vercelJsonRenamed = false;
let nextEnvRenamed = false;

function cleanup() {
  // Restore files in reverse order
  if (nextEnvRenamed && fs.existsSync(nextEnvBackup)) {
    console.log('🔄 Restoring next-env.d.ts...');
    if (fs.existsSync(nextEnvPath)) {
      fs.unlinkSync(nextEnvPath);
    }
    fs.renameSync(nextEnvBackup, nextEnvPath);
  }
  
  if (vercelJsonRenamed && fs.existsSync(vercelJsonBackup)) {
    console.log('🔄 Restoring vercel.json...');
    if (fs.existsSync(vercelJsonPath)) {
      fs.unlinkSync(vercelJsonPath);
    }
    fs.renameSync(vercelJsonBackup, vercelJsonPath);
  }
  
  if (tsconfigRenamed && fs.existsSync(tsconfigBackup)) {
    console.log('🔄 Restoring tsconfig.json...');
    if (fs.existsSync(tsconfigPath)) {
      fs.unlinkSync(tsconfigPath);
    }
    fs.renameSync(tsconfigBackup, tsconfigPath);
  }
  
  if (libRenamed && fs.existsSync(libBackup)) {
    console.log('🔄 Restoring lib/ directory...');
    if (fs.existsSync(libPath)) {
      fs.rmSync(libPath, { recursive: true, force: true });
    }
    fs.renameSync(libBackup, libPath);
  }
  
  if (appRenamed && fs.existsSync(appBackup)) {
    console.log('🔄 Restoring app/ directory...');
    if (fs.existsSync(appPath)) {
      fs.rmSync(appPath, { recursive: true, force: true });
    }
    fs.renameSync(appBackup, appPath);
  }
  
  if (nextConfigRenamed && fs.existsSync(nextConfigBackup)) {
    console.log('🔄 Restoring next.config.js...');
    if (fs.existsSync(nextConfigPath)) {
      fs.unlinkSync(nextConfigPath);
    }
    fs.renameSync(nextConfigBackup, nextConfigPath);
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
  // Hide Next.js files to prevent Netlify from auto-detecting Next.js
  if (fs.existsSync(nextConfigPath)) {
    console.log('📦 Temporarily renaming next.config.js...');
    fs.renameSync(nextConfigPath, nextConfigBackup);
    nextConfigRenamed = true;
  }

  if (fs.existsSync(appPath)) {
    console.log('📦 Temporarily renaming app/ directory...');
    fs.renameSync(appPath, appBackup);
    appRenamed = true;
  }

  if (fs.existsSync(libPath)) {
    console.log('📦 Temporarily renaming lib/ directory...');
    fs.renameSync(libPath, libBackup);
    libRenamed = true;
  }

  if (fs.existsSync(tsconfigPath)) {
    console.log('📦 Temporarily renaming tsconfig.json...');
    fs.renameSync(tsconfigPath, tsconfigBackup);
    tsconfigRenamed = true;
  }

  if (fs.existsSync(vercelJsonPath)) {
    console.log('📦 Temporarily renaming vercel.json...');
    fs.renameSync(vercelJsonPath, vercelJsonBackup);
    vercelJsonRenamed = true;
  }

  if (fs.existsSync(nextEnvPath)) {
    console.log('📦 Temporarily renaming next-env.d.ts...');
    fs.renameSync(nextEnvPath, nextEnvBackup);
    nextEnvRenamed = true;
  }

  // Run Vite build
  console.log('🏗️  Building Vite frontend...');
  execSync('npm run build:frontend', { 
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

