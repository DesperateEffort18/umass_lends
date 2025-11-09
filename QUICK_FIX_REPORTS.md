# Quick Fix: Item Reports Table Error

## Error
```
Could not find the table 'public.item_reports' in the schema cache
```

## Solution

You need to run the database migration to create the `item_reports` table. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

Copy and paste this SQL into the SQL Editor:

```sql
-- Create item_reports table
CREATE TABLE IF NOT EXISTS item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('scam', 'violence_or_hate', 'false_information', 'lending_restricted_items', 'nudity_or_sexual_activity')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  -- Prevent duplicate reports from same user for same item and reason
  UNIQUE(item_id, reporter_id, reason)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reason ON item_reports(reason);
CREATE INDEX IF NOT EXISTS idx_item_reports_item_reason ON item_reports(item_id, reason);

-- Enable Row Level Security
ALTER TABLE item_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to create reports
DROP POLICY IF EXISTS "Allow authenticated users to create reports" ON item_reports;
CREATE POLICY "Allow authenticated users to create reports"
ON item_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to view their own reports
DROP POLICY IF EXISTS "Allow users to view own reports" ON item_reports;
CREATE POLICY "Allow users to view own reports"
ON item_reports
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Function to check and auto-remove items with 5+ reports for same reason
CREATE OR REPLACE FUNCTION check_and_remove_reported_items()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count reports for this item with the same reason
  SELECT COUNT(*) INTO report_count
  FROM item_reports
  WHERE item_id = NEW.item_id
    AND reason = NEW.reason;
  
  -- If 5 or more reports for the same reason, mark item as unavailable
  IF report_count >= 5 THEN
    UPDATE items
    SET available = FALSE
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-remove items with 5+ reports
DROP TRIGGER IF EXISTS auto_remove_reported_items ON item_reports;
CREATE TRIGGER auto_remove_reported_items
  AFTER INSERT ON item_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_and_remove_reported_items();
```

### Step 3: Execute

Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify

You should see:
- ✅ Success message
- ✅ No errors

### Step 5: Test

1. Go to an item detail page
2. Click "Report Item"
3. Select a reason and submit
4. The error should be gone!

---

## Troubleshooting

### "Table already exists" error
- This is fine! The `IF NOT EXISTS` clause prevents errors
- The table is already created, you're good to go

### "Function already exists" error
- This is also fine! The function is already created
- Continue with the rest of the migration

### Still getting errors?
- Make sure you're running the SQL in the correct Supabase project
- Check that the `items` and `users` tables exist
- Verify you have the correct permissions

---

That's it! Once you run the migration, the report feature should work! 🎉

