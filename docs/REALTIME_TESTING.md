# Testing Realtime Messaging

This guide shows you how to test the realtime messaging feature.

## 🚀 Quick Test (Automated)

Run the automated test script:

```bash
node scripts/test-realtime-messaging.js
```

**What it does:**
1. Gets a test item from your database
2. Subscribes to realtime messages for that item
3. Sends 3 test messages via the API
4. You'll see each message appear **in real-time** as it's sent
5. Shows all messages at the end

**Expected output:**
```
💬 Testing Realtime Messaging...

1️⃣  Getting a test item...
   ✅ Using item: TI-84 Plus Calculator (ID: ...)

2️⃣  Subscribing to realtime messages...
   ✅ Successfully subscribed to realtime channel!

3️⃣  Sending test messages via API...

   Sending message 1: "Hello! Is this item still available?"
   ✅ Message sent (ID: ...)
   🔔 NEW MESSAGE RECEIVED IN REAL-TIME!
   Message: Hello! Is this item still available?
   ...
```

---

## 🧪 Manual Testing Methods

### Method 1: Browser HTML Test Page

1. Open `examples/test-realtime-browser.html` in your browser
2. Fill in:
   - Supabase URL (from your .env)
   - Supabase Anon Key (from your .env)
   - Item ID (from any item you created)
   - API Base URL: `http://localhost:3000`
3. Click **"Connect to Realtime"**
4. Type a message and click **"Send Message"**
5. Watch it appear in real-time!

**Note:** You may need to serve the HTML file through a local server due to CORS. You can:
- Use VS Code Live Server extension
- Or serve it with: `npx http-server examples/`

---

### Method 2: Two Terminal Windows

**Terminal 1: Subscribe to messages**
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const itemId = 'YOUR-ITEM-ID-HERE'; // Replace with actual item ID

console.log('Listening for messages on item:', itemId);

const channel = supabase
  .channel('messages:' + itemId)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: 'item_id=eq.' + itemId
  }, (payload) => {
    console.log('🔔 NEW MESSAGE:', payload.new.text);
  })
  .subscribe();

// Keep running
setInterval(() => {}, 1000);
"
```

**Terminal 2: Send messages**
```bash
# Send message 1
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"item_id": "YOUR-ITEM-ID", "text": "Hello! Is this available?"}'

# Wait 2 seconds, then send message 2
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"item_id": "YOUR-ITEM-ID", "text": "I would like to borrow this."}'
```

Watch Terminal 1 - you'll see messages appear in real-time!

---

### Method 3: Using React Hook (For Frontend)

If you're building a React frontend, use the provided hook:

```tsx
import { useRealtimeMessages } from '@/examples/useRealtimeMessages';

function ItemChat({ itemId }: { itemId: string }) {
  const { messages, loading, sendMessage } = useRealtimeMessages(itemId);

  const handleSend = async () => {
    await sendMessage('Hello!');
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

## 🔍 Verify Realtime is Working

### Check 1: Supabase Dashboard
1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Verify **Enable Realtime** is toggled ON

### Check 2: Test Subscription
Run the test script - if you see messages appearing immediately after sending, realtime is working!

### Check 3: Check Console
If using the browser test page, check the browser console for any errors.

---

## 🐛 Troubleshooting

### Issue: Messages not appearing in real-time

**Possible causes:**
1. Realtime not enabled in Supabase
   - **Fix:** Go to Database → Replication → Enable Realtime for `messages` table

2. Wrong item ID
   - **Fix:** Make sure you're using the correct item ID in your subscription

3. Subscription not established
   - **Fix:** Wait a moment after subscribing before sending messages

4. CORS issues (browser)
   - **Fix:** Make sure your Supabase project allows your domain, or use the Node.js script

### Issue: "CHANNEL_ERROR" status

**Possible causes:**
1. Invalid Supabase credentials
   - **Fix:** Check your .env file

2. Network issues
   - **Fix:** Check your internet connection

3. Supabase project paused
   - **Fix:** Check your Supabase dashboard

### Issue: Messages appear but with delay

**This is normal!** There's usually a small delay (100-500ms) for realtime updates. If it's more than a few seconds, check:
- Your internet connection
- Supabase project status
- Browser console for errors

---

## ✅ Success Indicators

You'll know realtime is working when:
- ✅ Messages appear immediately after sending (within 1 second)
- ✅ No page refresh needed
- ✅ Multiple clients see messages at the same time
- ✅ Test script shows "NEW MESSAGE RECEIVED IN REAL-TIME!"

---

## 🎯 Next Steps

Once realtime messaging is working:
1. Integrate it into your frontend UI
2. Add message notifications
3. Add typing indicators (optional)
4. Add message read receipts (optional)

---

## 💡 Pro Tips

1. **Test with two browsers** - Open the test page in two different browsers/windows to see messages sync in real-time
2. **Use the automated script** - It's the easiest way to verify everything works
3. **Check Supabase logs** - If something's not working, check Supabase dashboard → Logs
4. **Start simple** - Get basic realtime working before adding features like typing indicators

