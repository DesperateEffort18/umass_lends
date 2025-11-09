# Quick Fix: Profile Columns Error

## Error
```
column users.profile_picture_url does not exist
```

## Solution

You need to run the database migration to add the profile columns. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

Copy and paste this SQL into the SQL Editor:

```sql
-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS venmo_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cashapp_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zelle_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for profile lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Execute

Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify

You should see:
- ✅ Success message
- ✅ No errors

### Step 5: Test

1. Restart your backend server (if running)
2. Go to `/profile` page
3. The error should be gone!

---

## Alternative: Run from File

You can also run the migration from the file:

1. Open `database/profile_schema.sql`
2. Copy all the SQL
3. Paste into Supabase SQL Editor
4. Click Run

---

## Troubleshooting

### "Column already exists" error
- This is fine! The `IF NOT EXISTS` clause prevents errors
- The columns are already added, you're good to go

### "Function already exists" error
- This is also fine! The function is already created
- Continue with the rest of the migration

### Still getting errors?
- Make sure you're running the SQL in the correct Supabase project
- Check that the `users` table exists
- Verify you have the correct permissions

---

That's it! Once you run the migration, the profile page should work! 🎉

