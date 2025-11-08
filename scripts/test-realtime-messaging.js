/**
 * Test script for realtime messaging
 * This script demonstrates how realtime messaging works
 * 
 * Run with: node scripts/test-realtime-messaging.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtimeMessaging() {
  console.log('💬 Testing Realtime Messaging...\n');

  try {
    // Step 1: Get or create a test item
    console.log('1️⃣  Getting a test item...');
    const itemsResponse = await fetch(`${BASE_URL}/api/items`);
    const itemsData = await itemsResponse.json();
    
    if (!itemsData.success || itemsData.data.length === 0) {
      console.error('   ❌ No items found. Create an item first!');
      return;
    }
    
    const testItem = itemsData.data[0];
    const itemId = testItem.id;
    console.log(`   ✅ Using item: ${testItem.title} (ID: ${itemId})\n`);

    // Step 2: Subscribe to realtime messages
    console.log('2️⃣  Subscribing to realtime messages...');
    console.log('   (Listening for new messages on this item...)\n');
    
    const channel = supabase
      .channel(`messages:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          console.log('   🔔 NEW MESSAGE RECEIVED IN REAL-TIME!');
          console.log('   Message:', payload.new.text);
          console.log('   Sender ID:', payload.new.sender_id);
          console.log('   Timestamp:', payload.new.created_at);
          console.log('');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Successfully subscribed to realtime channel!\n');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('   ❌ Error subscribing to channel');
        }
      });

    // Wait a moment for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Send messages via API (these should appear in real-time)
    console.log('3️⃣  Sending test messages via API...\n');
    
    const messages = [
      'Hello! Is this item still available?',
      'I would like to borrow this item.',
      'When can I pick it up?',
    ];

    for (let i = 0; i < messages.length; i++) {
      console.log(`   Sending message ${i + 1}: "${messages[i]}"`);
      
      const response = await fetch(`${BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
          text: messages[i],
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Message sent (ID: ${data.data.id})`);
      } else {
        console.error(`   ❌ Failed: ${data.error}`);
      }
      
      // Wait 2 seconds between messages so you can see them appear
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n4️⃣  Waiting 3 seconds to see if any more messages arrive...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Get all messages to verify
    console.log('5️⃣  Fetching all messages for this item...');
    const messagesResponse = await fetch(`${BASE_URL}/api/messages?itemId=${itemId}`);
    const messagesData = await messagesResponse.json();
    
    if (messagesData.success) {
      console.log(`   ✅ Found ${messagesData.data.length} total messages:\n`);
      messagesData.data.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.text}`);
        console.log(`      (Sent at: ${msg.created_at})\n`);
      });
    }

    // Step 5: Cleanup
    console.log('6️⃣  Unsubscribing from realtime channel...');
    await supabase.removeChannel(channel);
    console.log('   ✅ Unsubscribed\n');

    console.log('✅ Realtime messaging test completed!\n');
    console.log('💡 What happened:');
    console.log('   - You subscribed to realtime updates for the item');
    console.log('   - Messages were sent via the API');
    console.log('   - Each message appeared in real-time as it was inserted');
    console.log('   - This is how live chat works in your app!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the test
testRealtimeMessaging();

