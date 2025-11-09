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

