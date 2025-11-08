# Testing Guide

This guide shows you multiple ways to verify that your database schema and API are working correctly.

## ✅ Method 1: Check Supabase Table Editor (Easiest)

1. Go to your Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. You should see these tables:
   - ✅ `users`
   - ✅ `items`
   - ✅ `borrow_requests`
   - ✅ `messages`

If you see all 4 tables, your schema was created successfully!

---

## ✅ Method 2: Run Test Queries in Supabase SQL Editor

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy and paste the contents of `scripts/test-database.sql`
4. Click **Run** (or press Ctrl+Enter)

This will:
- ✅ Verify all tables exist
- ✅ Show table structures
- ✅ Check indexes
- ✅ Verify RLS is enabled
- ✅ Test inserting data
- ✅ Check if realtime is enabled

---

## ✅ Method 3: Test Supabase Connection (Node.js Script)

This script tests your Supabase connection and creates test data.

### Prerequisites
```bash
npm install
```

### Run the test
```bash
node scripts/test-supabase-connection.js
```

**What it does:**
- ✅ Tests connection to Supabase
- ✅ Verifies all tables exist
- ✅ Creates a test user (`dev-user`)
- ✅ Creates a test item
- ✅ Queries the data back

**Expected output:**
```
🔌 Testing Supabase connection...

1️⃣  Checking if tables exist...
   ✅ Items table exists

2️⃣  Checking users table...
   ✅ Users table exists

... (more tests)

✅ All connection tests passed!
```

---

## ✅ Method 4: Test API Endpoints

This tests your Next.js API routes.

### Step 1: Start the dev server
```bash
npm run dev
```

Wait for it to start (you should see "Ready" message).

### Step 2: Run the API test script
In a new terminal:
```bash
node scripts/test-api.js
```

**What it does:**
- ✅ Tests GET /api/items
- ✅ Tests POST /api/items (creates an item)
- ✅ Tests GET /api/items/:id
- ✅ Tests GET /api/borrow/mine

**Expected output:**
```
🧪 Testing UMass Lends API...

1️⃣  Testing GET /api/items...
   ✅ Response: { success: true, data: [] }
   Status: 200

2️⃣  Testing POST /api/items...
   ✅ Response: { success: true, data: { id: '...', title: '...' } }
   Status: 201

... (more tests)

✅ All API tests completed successfully!
```

---

## ✅ Method 5: Manual API Testing with cURL

### Test 1: List all items
```bash
curl http://localhost:3000/api/items
```

**Expected response:**
```json
{
  "success": true,
  "data": []
}
```

### Test 2: Create an item
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Laptop",
    "description": "Testing the API",
    "category": "Electronics",
    "available": true
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": "some-uuid",
    "owner_id": "dev-user",
    "title": "Test Laptop",
    ...
  }
}
```

### Test 3: Get the created item
```bash
curl http://localhost:3000/api/items/{item-id}
```

Replace `{item-id}` with the ID from the previous response.

---

## ✅ Method 6: Check in Supabase Dashboard

### Verify Tables Were Created

1. Go to **Table Editor** → Click on `items` table
2. You should see columns:
   - `id` (uuid)
   - `owner_id` (uuid)
   - `title` (text)
   - `description` (text)
   - `category` (text)
   - `condition` (text)
   - `image_url` (text)
   - `available` (boolean)
   - `created_at` (timestamp)

3. Repeat for other tables: `users`, `borrow_requests`, `messages`

### Verify Realtime is Enabled

1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Check that **Enable Realtime** is toggled ON

### Verify RLS is Enabled

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - `items`
   - `borrow_requests`
   - `messages`

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"

**Problem:** Tables weren't created.

**Solution:**
1. Go back to Supabase SQL Editor
2. Run `database/schema.sql` again
3. Check for any error messages
4. Verify tables in Table Editor

### Issue: "permission denied for table"

**Problem:** RLS policies might not be set correctly.

**Solution:**
1. Check that RLS policies were created
2. Run the policy creation statements again:
   ```sql
   CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Allow all operations on borrow_requests" ON borrow_requests FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
   ```

### Issue: API returns 500 error

**Problem:** Environment variables not set or Supabase connection failed.

**Solution:**
1. Check your `.env` file exists and has correct values
2. Restart your Next.js dev server
3. Run `node scripts/test-supabase-connection.js` to verify connection

### Issue: "Missing Supabase environment variables"

**Problem:** `.env` file not found or incomplete.

**Solution:**
1. Create `.env` file in project root
2. Add all required variables (see README.md)
3. Restart dev server

---

## ✅ Quick Verification Checklist

- [ ] Tables visible in Supabase Table Editor
- [ ] Can run test queries in SQL Editor
- [ ] `test-supabase-connection.js` passes
- [ ] Next.js dev server starts without errors
- [ ] `test-api.js` passes
- [ ] Can create items via API
- [ ] Can query items via API
- [ ] Realtime enabled for messages table

---

## 📝 Next Steps

Once all tests pass:

1. ✅ Your database is set up correctly
2. ✅ Your API is working
3. ✅ You're ready to build the frontend!

See `examples/api-tests.md` for more API testing examples.

