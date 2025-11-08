/**
 * Script to add test items (calculator and jacket)
 * Run with: node scripts/add-test-items.js
 */

require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const testItems = [
  {
    title: 'TI-84 Plus Calculator',
    description: 'Texas Instruments TI-84 Plus graphing calculator. Great for math and engineering courses. Comes with batteries.',
    category: 'Electronics',
    condition: 'Good',
    available: true,
  },
  {
    title: 'Winter Jacket',
    description: 'Warm winter jacket, size Medium. Perfect for cold Massachusetts winters. Clean and in excellent condition.',
    category: 'Clothing',
    condition: 'Excellent',
    available: true,
  },
];

async function addItems() {
  console.log('📦 Adding test items...\n');

  for (const item of testItems) {
    try {
      console.log(`Adding: ${item.title}...`);
      
      const response = await fetch(`${BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`   ✅ Created: ${item.title}`);
        console.log(`   ID: ${data.data.id}`);
        console.log('');
      } else {
        console.error(`   ❌ Failed: ${data.error}`);
        console.log('');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('✅ Done! Listing all items...\n');
  
  // List all items
  try {
    const response = await fetch(`${BASE_URL}/api/items`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.data.length} items:\n`);
      data.data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Condition: ${item.condition}`);
        console.log(`   Available: ${item.available ? 'Yes' : 'No'}`);
        console.log(`   ID: ${item.id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error listing items:', error.message);
  }
}

addItems();

