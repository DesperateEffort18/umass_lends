/**
 * Test script to verify Supabase connection
 * Run with: node scripts/test-supabase-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

async function testConnection() {
  console.log('🔌 Testing Supabase connection...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣  Checking if tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('items')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('   ❌ Error:', tablesError.message);
      if (tablesError.message.includes('relation') || tablesError.message.includes('does not exist')) {
        console.error('   💡 Tables not found! Make sure you ran database/schema.sql in Supabase SQL Editor');
      }
      return;
    }
    console.log('   ✅ Items table exists');
    console.log('');

    // Test 2: Check users table
    console.log('2️⃣  Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('   ❌ Error:', usersError.message);
      return;
    }
    console.log('   ✅ Users table exists');
    console.log('');

    // Test 3: Check borrow_requests table
    console.log('3️⃣  Checking borrow_requests table...');
    const { data: borrowRequests, error: borrowError } = await supabase
      .from('borrow_requests')
      .select('count', { count: 'exact', head: true });
    
    if (borrowError) {
      console.error('   ❌ Error:', borrowError.message);
      return;
    }
    console.log('   ✅ Borrow requests table exists');
    console.log('');

    // Test 4: Check messages table
    console.log('4️⃣  Checking messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true });
    
    if (messagesError) {
      console.error('   ❌ Error:', messagesError.message);
      return;
    }
    console.log('   ✅ Messages table exists');
    console.log('');

    // Test 5: Create a test user (using a fixed UUID for dev-user)
    console.log('5️⃣  Creating test user (dev-user)...');
    const devUserId = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for dev-user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: devUserId,
        email: 'dev-user@umass.edu',
        name: 'Dev User',
      })
      .select()
      .single();
    
    if (userError) {
      console.error('   ❌ Error:', userError.message);
      console.error('   💡 Note: This might fail if the user already exists. Continuing...');
    } else {
      console.log('   ✅ Test user created:', user);
    }
    console.log('');

    // Test 6: Create a test item
    console.log('6️⃣  Creating test item...');
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert({
        owner_id: devUserId,
        title: 'Test Item from Connection Test',
        description: 'This item was created by the connection test script',
        category: 'Test',
        condition: 'New',
        available: true,
      })
      .select()
      .single();
    
    if (itemError) {
      console.error('   ❌ Error:', itemError.message);
      return;
    }
    console.log('   ✅ Test item created:', item);
    console.log('');

    // Test 7: Query the item back
    console.log('7️⃣  Querying test item...');
    const { data: queriedItem, error: queryError } = await supabase
      .from('items')
      .select('*')
      .eq('id', item.id)
      .single();
    
    if (queryError) {
      console.error('   ❌ Error:', queryError.message);
      return;
    }
    console.log('   ✅ Item queried successfully:', queriedItem);
    console.log('');

    console.log('✅ All connection tests passed!');
    console.log('\n💡 Your Supabase connection is working correctly.');
    console.log('   You can now start your Next.js dev server and test the API endpoints.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

testConnection();

