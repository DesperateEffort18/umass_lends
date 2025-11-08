/**
 * Helper script to get your Supabase access token
 * This connects to Supabase and gets your current session token
 * 
 * Usage: node scripts/get-token.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Make sure your .env file contains:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getToken() {
  console.log('🔑 Get Supabase Access Token\n');

  try {
    // Check if there's an existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ Found existing session!');
      console.log('   User:', session.user.email);
      console.log('   Access Token:', session.access_token);
      console.log('');
      console.log('💡 Use this token to test the API:');
      console.log(`   node scripts/test-auth-api.js ${session.access_token}`);
      console.log('');
      rl.close();
      return;
    }

    // No session, need to sign in
    console.log('⚠️  No active session found.');
    console.log('   You need to sign in to get an access token.\n');

    const email = await question('Enter your email: ');
    const password = await question('Enter your password: ');

    console.log('\n🔐 Signing in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.error('');
      console.error('💡 Make sure:');
      console.error('   1. You have an account (sign up first if needed)');
      console.error('   2. Your email and password are correct');
      console.error('   3. Your account is verified (check your email)');
      rl.close();
      process.exit(1);
    }

    if (data.session) {
      console.log('✅ Signed in successfully!');
      console.log('   User:', data.session.user.email);
      console.log('   Access Token:', data.session.access_token);
      console.log('');
      console.log('💡 Use this token to test the API:');
      console.log(`   node scripts/test-auth-api.js ${data.session.access_token}`);
      console.log('');
      console.log('💡 Or copy the token and use it in your API requests:');
      console.log('   Authorization: Bearer ' + data.session.access_token);
    } else {
      console.error('❌ Sign in succeeded but no session was created');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

getToken();

