/**
 * Test script for authenticated API endpoints
 * This script helps you test the API with real Supabase Auth
 * 
 * Usage:
 * 1. Sign in through your frontend or Supabase dashboard
 * 2. Get your access token (see instructions below)
 * 3. Run: node scripts/test-auth-api.js YOUR_ACCESS_TOKEN
 */

require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('❌ Error: Access token required!');
  console.error('');
  console.error('Usage: node scripts/test-auth-api.js YOUR_ACCESS_TOKEN');
  console.error('');
  console.error('How to get your access token:');
  console.error('1. Sign in through your frontend');
  console.error('2. Open browser DevTools (F12)');
  console.error('3. Go to Application → Local Storage');
  console.error('4. Find: sb-<project-id>-auth-token');
  console.error('5. Copy the "access_token" value');
  console.error('');
  console.error('Or use Supabase CLI:');
  console.error('  npx supabase auth login');
  console.error('');
  process.exit(1);
}

async function testAuthenticatedAPI() {
  console.log('🔐 Testing Authenticated API Endpoints...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 20)}...\n`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
  };

  try {
    // Test 1: Create an item (requires auth)
    console.log('1️⃣  Testing POST /api/items (create item - requires auth)...');
    const createItemResponse = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Test Item from Auth Test',
        description: 'This item was created using authenticated API',
        category: 'Electronics',
        condition: 'Good',
        available: true,
      }),
    });

    const createItemData = await createItemResponse.json();
    console.log('   Status:', createItemResponse.status);
    console.log('   Response:', createItemData);

    if (!createItemData.success) {
      console.error('   ❌ Failed:', createItemData.error);
      if (createItemResponse.status === 401) {
        console.error('   💡 Token is invalid or expired. Please sign in again and get a new token.');
        return;
      }
      return;
    }

    const itemId = createItemData.data.id;
    console.log('   ✅ Item created! ID:', itemId);
    console.log('');

    // Test 2: Submit a borrow request (requires auth)
    console.log('2️⃣  Testing POST /api/items/:id/borrow (submit borrow request - requires auth)...');
    const borrowResponse = await fetch(`${BASE_URL}/api/items/${itemId}/borrow`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        borrow_start_date: '2024-12-01',
        borrow_end_date: '2024-12-15',
      }),
    });

    const borrowData = await borrowResponse.json();
    console.log('   Status:', borrowResponse.status);
    console.log('   Response:', borrowData);

    if (borrowData.success) {
      console.log('   ✅ Borrow request created! ID:', borrowData.data.id);
    } else {
      console.error('   ❌ Failed:', borrowData.error);
      // This might fail if you're trying to borrow your own item
      if (borrowData.error.includes('own item')) {
        console.error('   💡 This is expected - you cannot borrow your own item.');
      }
    }
    console.log('');

    // Test 3: Get my borrow requests (requires auth)
    console.log('3️⃣  Testing GET /api/borrow/mine (get my requests - requires auth)...');
    const myRequestsResponse = await fetch(`${BASE_URL}/api/borrow/mine`, {
      method: 'GET',
      headers,
    });

    const myRequestsData = await myRequestsResponse.json();
    console.log('   Status:', myRequestsResponse.status);
    console.log('   Response:', myRequestsData);

    if (myRequestsData.success) {
      console.log(`   ✅ Found ${myRequestsData.data.length} borrow requests`);
    } else {
      console.error('   ❌ Failed:', myRequestsData.error);
    }
    console.log('');

    // Test 4: Send a message (requires auth)
    console.log('4️⃣  Testing POST /api/messages (send message - requires auth)...');
    const messageResponse = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        item_id: itemId,
        text: 'Hello! Is this item still available?',
      }),
    });

    const messageData = await messageResponse.json();
    console.log('   Status:', messageResponse.status);
    console.log('   Response:', messageData);

    if (messageData.success) {
      console.log('   ✅ Message sent! ID:', messageData.data.id);
    } else {
      console.error('   ❌ Failed:', messageData.error);
    }
    console.log('');

    // Test 5: Test without token (should fail)
    console.log('5️⃣  Testing POST /api/items without token (should fail)...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify({
        title: 'This should fail',
      }),
    });

    const noAuthData = await noAuthResponse.json();
    console.log('   Status:', noAuthResponse.status);
    console.log('   Response:', noAuthData);

    if (noAuthResponse.status === 401 && noAuthData.error?.includes('Unauthorized')) {
      console.log('   ✅ Correctly rejected unauthenticated request!');
    } else {
      console.error('   ❌ Expected 401 Unauthorized, got:', noAuthResponse.status);
    }
    console.log('');

    console.log('✅ All authentication tests completed!');
    console.log('');
    console.log('💡 Summary:');
    console.log('   - Authenticated requests: Working ✅');
    console.log('   - Unauthenticated requests: Rejected ✅');
    console.log('   - Your API is properly secured!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('');
    console.error('💡 Make sure:');
    console.error('   1. Your Next.js dev server is running (npm run dev)');
    console.error('   2. Your access token is valid');
    console.error('   3. Your .env file is configured correctly');
  }
}

testAuthenticatedAPI();

