# Quick Test Guide - Adding Items

## ✅ Calculator and Jacket Already Added!

Your test items have been created:
- **TI-84 Plus Calculator** (Electronics, Good condition)
- **Winter Jacket** (Clothing, Excellent condition)

## 🧪 Manual Testing Methods

### Method 1: Using the Script (Easiest)

```bash
node scripts/add-test-items.js
```

### Method 2: Using cURL

#### Add Calculator
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"TI-84 Plus Calculator\",
    \"description\": \"Texas Instruments TI-84 Plus graphing calculator. Great for math and engineering courses.\",
    \"category\": \"Electronics\",
    \"condition\": \"Good\",
    \"available\": true
  }"
```

#### Add Jacket
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Winter Jacket\",
    \"description\": \"Warm winter jacket, size Medium. Perfect for cold Massachusetts winters.\",
    \"category\": \"Clothing\",
    \"condition\": \"Excellent\",
    \"available\": true
  }"
```

### Method 3: Using JavaScript Fetch (Browser Console)

Open your browser console (F12) and run:

```javascript
// Add Calculator
fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'TI-84 Plus Calculator',
    description: 'Texas Instruments TI-84 Plus graphing calculator. Great for math and engineering courses.',
    category: 'Electronics',
    condition: 'Good',
    available: true
  })
})
.then(r => r.json())
.then(data => console.log('Calculator:', data));

// Add Jacket
fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Winter Jacket',
    description: 'Warm winter jacket, size Medium. Perfect for cold Massachusetts winters.',
    category: 'Clothing',
    condition: 'Excellent',
    available: true
  })
})
.then(r => r.json())
.then(data => console.log('Jacket:', data));
```

## 📋 View All Items

### Using cURL
```bash
curl http://localhost:3000/api/items
```

### Using Browser
Just visit: http://localhost:3000/api/items

### Using JavaScript
```javascript
fetch('http://localhost:3000/api/items')
  .then(r => r.json())
  .then(data => console.log('All items:', data));
```

## 🧪 Test Other Operations

### Get a Specific Item
```bash
# Replace {item-id} with actual ID from the list
curl http://localhost:3000/api/items/{item-id}
```

### Submit a Borrow Request
```bash
curl -X POST http://localhost:3000/api/items/{item-id}/borrow \
  -H "Content-Type: application/json" \
  -d "{
    \"borrow_start_date\": \"2024-12-01\",
    \"borrow_end_date\": \"2024-12-15\"
  }"
```

### View Your Borrow Requests
```bash
curl http://localhost:3000/api/borrow/mine
```

### Send a Message
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d "{
    \"item_id\": \"{item-id}\",
    \"text\": \"Hi! Is this item still available?\"
  }"
```

## 💡 Quick Tips

1. **View items in browser**: http://localhost:3000/api/items
2. **Copy item IDs** from the response to use in other requests
3. **Check Supabase Table Editor** to see items in the database
4. **Use the test script** for quick testing: `node scripts/add-test-items.js`

## 🎯 Your Current Items

You now have:
- TI-84 Plus Calculator
- Winter Jacket
- Test MacBook Pro (from earlier tests)
- Test items (from connection tests)

All items are available for borrowing!

