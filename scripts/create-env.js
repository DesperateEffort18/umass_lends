#!/usr/bin/env node
/**
 * Helper script to create .env file
 * This will guide you through creating the .env file with your Supabase credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createEnvFile() {
  console.log('\n🔧 Creating .env file for UMass Lends\n');
  console.log('You need to get these values from your Supabase project:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: Settings → API');
  console.log('4. Copy the values below\n');

  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const supabaseAnonKey = await question('Enter your Supabase Anon Key: ');
  const supabaseServiceKey = await question('Enter your Supabase Service Role Key (optional, press Enter to skip): ');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Error: Supabase URL and Anon Key are required!');
    rl.close();
    process.exit(1);
  }

  const envContent = `# Supabase Configuration (for Next.js backend)
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
${supabaseServiceKey ? `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}` : '# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here'}

# Supabase Configuration (for Vite frontend - use SAME values as above)
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# API URL (optional - defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000
`;

  const envPath = path.join(process.cwd(), '.env');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\n⚠️  .env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled. .env file not created.');
      rl.close();
      return;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');
  console.log(`📁 Location: ${envPath}`);
  console.log('\n⚠️  IMPORTANT: Restart your servers after creating .env file!');
  console.log('   - Stop your backend server (Ctrl+C)');
  console.log('   - Stop your frontend server (Ctrl+C)');
  console.log('   - Start them again: npm run dev:backend and npm run dev:frontend\n');
  
  rl.close();
}

createEnvFile().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

