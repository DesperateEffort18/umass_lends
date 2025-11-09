# Fix: Missing 'item_reports' Table Error

## Error Message
```
Could not find the table 'public.item_reports' in the schema cache
```

## Problem
Your database is missing the `item_reports` table. This table stores reports of items for violations (scam, violence, etc.).

## Solution: Run the Migration Script

You need to run the migration script in your Supabase SQL Editor to create the missing table.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Migration Script
Copy and paste the following SQL into the SQL Editor:

```sql
-- Add item_reports table
-- This table stores reports of items for violations

CREATE TABLE IF NOT EXISTS item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('scam', 'violence_or_hate', 'false_information', 'lending_restricted_items', 'nudity_or_sexual_activity')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  -- Prevent duplicate reports: same user can't report same item for same reason twice
  CONSTRAINT unique_report UNIQUE (item_id, reporter_id, reason)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter_id ON item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reason ON item_reports(reason);
CREATE INDEX IF NOT EXISTS idx_item_reports_created_at ON item_reports(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE item_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on item_reports" ON item_reports;

-- For now, create policy that allows all operations (will be restricted when auth is added)
CREATE POLICY "Allow all operations on item_reports" ON item_reports FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Execute the Script
1. Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for the script to complete
3. You should see a success message

### Step 4: Verify the Table Was Created
Run this query to verify:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'item_reports' 
ORDER BY ordinal_position;
```

You should see columns:
- `id` (uuid)
- `item_id` (uuid)
- `reporter_id` (uuid)
- `reason` (text)
- `created_at` (timestamp without time zone)

## Quick Fix Script
If you just need the table, use this:

```sql
CREATE TABLE IF NOT EXISTS item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('scam', 'violence_or_hate', 'false_information', 'lending_restricted_items', 'nudity_or_sexual_activity')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_report UNIQUE (item_id, reporter_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter_id ON item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reason ON item_reports(reason);

ALTER TABLE item_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on item_reports" ON item_reports;
CREATE POLICY "Allow all operations on item_reports" ON item_reports FOR ALL USING (true) WITH CHECK (true);
```

## After Running the Migration
1. The error should be resolved
2. Users will be able to report items
3. Duplicate reports (same user, same item, same reason) will be prevented
4. Items with 2+ reports for the same reason will be automatically deleted completely

## Table Structure

### Columns
- **id**: UUID primary key
- **item_id**: UUID foreign key to items table
- **reporter_id**: UUID foreign key to users table (person who reported)
- **reason**: Text field with CHECK constraint for valid reasons:
  - `scam`
  - `violence_or_hate`
  - `false_information`
  - `lending_restricted_items`
  - `nudity_or_sexual_activity`
- **created_at**: Timestamp of when the report was created

### Constraints
- **unique_report**: Prevents the same user from reporting the same item for the same reason twice
- **fk_item**: Foreign key to items table (cascades on delete)
- **fk_reporter**: Foreign key to users table (cascades on delete)

### Features
- **Auto-deletion**: When an item receives 2+ reports for the same reason, it's automatically deleted completely (including image from storage, borrow requests, messages, and reports)
- **Duplicate prevention**: Users can't report the same item for the same reason twice
- **Self-report prevention**: Users cannot report their own items (enforced in API)

