# API Test Examples

This document contains curl and JavaScript fetch examples for testing all API endpoints.

## Base URL
```
http://localhost:3000
```

## 1. Create Item

### cURL
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro 16 inch",
    "description": "Great condition, barely used",
    "category": "Electronics",
    "condition": "Like New",
    "image_url": "https://example.com/macbook.jpg",
    "available": true
  }'
```

### JavaScript Fetch
```javascript
const response = await fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'MacBook Pro 16 inch',
    description: 'Great condition, barely used',
    category: 'Electronics',
    condition: 'Like New',
    image_url: 'https://example.com/macbook.jpg',
    available: true,
  }),
});

const data = await response.json();
console.log(data);
```

## 2. List All Items

### cURL
```bash
# Get all items
curl http://localhost:3000/api/items

# Get only available items
curl "http://localhost:3000/api/items?available=true"

# Get only unavailable items
curl "http://localhost:3000/api/items?available=false"
```

### JavaScript Fetch
```javascript
// Get all items
const response = await fetch('http://localhost:3000/api/items');
const data = await response.json();
console.log(data);

// Get only available items
const availableResponse = await fetch('http://localhost:3000/api/items?available=true');
const availableData = await availableResponse.json();
console.log(availableData);
```

## 3. Get Single Item

### cURL
```bash
curl http://localhost:3000/api/items/{item-id}
```

### JavaScript Fetch
```javascript
const itemId = 'your-item-id-here';
const response = await fetch(`http://localhost:3000/api/items/${itemId}`);
const data = await response.json();
console.log(data);
```

## 4. Submit Borrow Request

### cURL
```bash
curl -X POST http://localhost:3000/api/items/{item-id}/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "borrow_start_date": "2024-01-15",
    "borrow_end_date": "2024-01-20"
  }'
```

### JavaScript Fetch
```javascript
const itemId = 'your-item-id-here';
const response = await fetch(`http://localhost:3000/api/items/${itemId}/borrow`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    borrow_start_date: '2024-01-15',
    borrow_end_date: '2024-01-20',
  }),
});

const data = await response.json();
console.log(data);
```

## 5. Approve Borrow Request

### cURL
```bash
curl -X POST http://localhost:3000/api/borrow/{request-id}/approve
```

### JavaScript Fetch
```javascript
const requestId = 'your-request-id-here';
const response = await fetch(`http://localhost:3000/api/borrow/${requestId}/approve`, {
  method: 'POST',
});

const data = await response.json();
console.log(data);
```

## 6. Reject Borrow Request

### cURL
```bash
curl -X POST http://localhost:3000/api/borrow/{request-id}/reject
```

### JavaScript Fetch
```javascript
const requestId = 'your-request-id-here';
const response = await fetch(`http://localhost:3000/api/borrow/${requestId}/reject`, {
  method: 'POST',
});

const data = await response.json();
console.log(data);
```

## 7. Get My Borrow Requests

### cURL
```bash
# Get all my borrow requests
curl http://localhost:3000/api/borrow/mine

# Get only pending requests
curl "http://localhost:3000/api/borrow/mine?status=pending"

# Get only approved requests
curl "http://localhost:3000/api/borrow/mine?status=approved"
```

### JavaScript Fetch
```javascript
// Get all my borrow requests
const response = await fetch('http://localhost:3000/api/borrow/mine');
const data = await response.json();
console.log(data);

// Get only pending requests
const pendingResponse = await fetch('http://localhost:3000/api/borrow/mine?status=pending');
const pendingData = await pendingResponse.json();
console.log(pendingData);
```

## 8. Send Message

### cURL
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "your-item-id-here",
    "text": "Hi! Is this item still available?"
  }'
```

### JavaScript Fetch
```javascript
const response = await fetch('http://localhost:3000/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    item_id: 'your-item-id-here',
    text: 'Hi! Is this item still available?',
  }),
});

const data = await response.json();
console.log(data);
```

## 9. Get Messages for Item

### cURL
```bash
curl "http://localhost:3000/api/messages?itemId=your-item-id-here"
```

### JavaScript Fetch
```javascript
const itemId = 'your-item-id-here';
const response = await fetch(`http://localhost:3000/api/messages?itemId=${itemId}`);
const data = await response.json();
console.log(data);
```

## Complete Test Flow Example

```javascript
// Complete test flow
async function testCompleteFlow() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. Create an item
  const createItemResponse = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Item',
      description: 'This is a test item',
      category: 'Books',
      condition: 'Good',
      available: true,
    }),
  });
  const itemData = await createItemResponse.json();
  const itemId = itemData.data.id;
  console.log('Created item:', itemId);
  
  // 2. Get the item
  const getItemResponse = await fetch(`${baseUrl}/api/items/${itemId}`);
  const item = await getItemResponse.json();
  console.log('Retrieved item:', item);
  
  // 3. Submit borrow request
  const borrowResponse = await fetch(`${baseUrl}/api/items/${itemId}/borrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      borrow_start_date: '2024-01-15',
      borrow_end_date: '2024-01-20',
    }),
  });
  const borrowData = await borrowResponse.json();
  const requestId = borrowData.data.id;
  console.log('Created borrow request:', requestId);
  
  // 4. Send a message
  const messageResponse = await fetch(`${baseUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_id: itemId,
      text: 'Hello! I would like to borrow this item.',
    }),
  });
  const messageData = await messageResponse.json();
  console.log('Sent message:', messageData);
  
  // 5. Get messages
  const getMessagesResponse = await fetch(`${baseUrl}/api/messages?itemId=${itemId}`);
  const messages = await getMessagesResponse.json();
  console.log('Messages:', messages);
  
  // 6. Get my borrow requests
  const myRequestsResponse = await fetch(`${baseUrl}/api/borrow/mine`);
  const myRequests = await myRequestsResponse.json();
  console.log('My borrow requests:', myRequests);
}

// Run the test
testCompleteFlow().catch(console.error);
```

