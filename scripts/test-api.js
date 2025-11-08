/**
 * Test script to verify API endpoints are working
 * Run with: node scripts/test-api.js
 */

require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing UMass Lends API...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: Create a user (if needed)
    console.log('1️⃣  Testing GET /api/items (should return empty array)...');
    const itemsResponse = await fetch(`${BASE_URL}/api/items`);
    const itemsData = await itemsResponse.json();
    console.log('   ✅ Response:', itemsData);
    console.log('   Status:', itemsResponse.status);
    console.log('');

    // Test 2: Create an item
    console.log('2️⃣  Testing POST /api/items (create item)...');
    const createItemResponse = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test MacBook Pro',
        description: 'This is a test item to verify the API works',
        category: 'Electronics',
        condition: 'Like New',
        available: true,
      }),
    });
    const createItemData = await createItemResponse.json();
    console.log('   ✅ Response:', createItemData);
    console.log('   Status:', createItemResponse.status);
    
    if (!createItemData.success) {
      console.error('   ❌ Failed to create item:', createItemData.error);
      return;
    }
    
    const itemId = createItemData.data.id;
    console.log('   Item ID:', itemId);
    console.log('');

    // Test 3: Get the created item
    console.log('3️⃣  Testing GET /api/items/:id (get item)...');
    const getItemResponse = await fetch(`${BASE_URL}/api/items/${itemId}`);
    const getItemData = await getItemResponse.json();
    console.log('   ✅ Response:', getItemData);
    console.log('   Status:', getItemResponse.status);
    console.log('');

    // Test 4: List all items
    console.log('4️⃣  Testing GET /api/items (list all items)...');
    const listItemsResponse = await fetch(`${BASE_URL}/api/items`);
    const listItemsData = await listItemsResponse.json();
    console.log('   ✅ Response:', listItemsData);
    console.log('   Status:', listItemsResponse.status);
    console.log('   Items count:', listItemsData.data?.length || 0);
    console.log('');

    // Test 5: Get my borrow requests
    console.log('5️⃣  Testing GET /api/borrow/mine (get my borrow requests)...');
    const borrowRequestsResponse = await fetch(`${BASE_URL}/api/borrow/mine`);
    const borrowRequestsData = await borrowRequestsResponse.json();
    console.log('   ✅ Response:', borrowRequestsData);
    console.log('   Status:', borrowRequestsResponse.status);
    console.log('');

    console.log('✅ All API tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Check Supabase Table Editor to see the created item');
    console.log('   - Test other endpoints using examples/api-tests.md');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The Next.js dev server is running (npm run dev)');
    console.error('   2. Your .env file is configured correctly');
    console.error('   3. The database schema was run in Supabase');
  }
}

// Run tests
testAPI();

