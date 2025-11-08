# Detailed Setup Guide

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `umass-lends` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created (takes ~2 minutes)

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `users`, `items`, `borrow_requests`, `messages`

### Step 3: Enable Realtime

1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Toggle **Enable Realtime** to ON
4. Save changes

## Environment Variables

### Getting Your Supabase Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Find these values:

**Project URL**
- Copy the value under "Project URL"
- Example: `https://abcdefghijklmnop.supabase.co`

**Anon/Public Key**
- Copy the value under "Project API keys" → "anon" → "public"
- This is safe to expose in client-side code

**Service Role Key**
- Copy the value under "Project API keys" → "service_role" → "secret"
- ⚠️ **NEVER expose this in client-side code!**
- This key bypasses Row Level Security

### Creating .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=development
   ```

## Testing the Setup

### 1. Start the Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.3s
○ Compiling /api/items ...
✓ Compiled /api/items in 234ms
```

### 2. Test Database Connection

Create a test file `test-connection.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('items').select('count');
  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Database connection successful!');
  }
}

test();
```

Run it:
```bash
node test-connection.js
```

### 3. Test API Endpoint

```bash
curl http://localhost:3000/api/items
```

You should get:
```json
{
  "success": true,
  "data": []
}
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure your `.env` file exists and contains all required variables.

### Issue: "relation does not exist"

**Solution**: Run the SQL schema in Supabase SQL Editor again.

### Issue: "permission denied for table"

**Solution**: Check that RLS policies are set correctly in `database/schema.sql`.

### Issue: Realtime not working

**Solution**: 
1. Go to **Database** → **Replication** in Supabase
2. Enable Realtime for the `messages` table
3. Wait a few seconds and try again

### Issue: Port 3000 already in use

**Solution**: 
1. Kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill
   ```
2. Or use a different port:
   ```bash
   PORT=3001 npm run dev
   ```

## Next Steps

Once setup is complete:

1. ✅ Test all API endpoints (see `examples/api-tests.md`)
2. ✅ Test realtime messaging (see `examples/realtime-messaging.ts`)
3. ✅ Start building the frontend UI
4. ✅ Integrate Supabase Auth when ready

