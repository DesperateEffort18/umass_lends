-- UMass Lends Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (placeholder for now, will be replaced by Supabase Auth later)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  condition TEXT,
  image_url TEXT,
  location TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Borrow requests table
CREATE TABLE IF NOT EXISTS borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  borrower_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  request_date TIMESTAMP DEFAULT NOW(),
  borrow_start_date DATE,
  borrow_end_date DATE,
  borrow_start_time TIME DEFAULT '00:00:00',
  borrow_duration_hours INTEGER DEFAULT 0,
  borrow_duration_minutes INTEGER DEFAULT 0,
  return_deadline_datetime TIMESTAMP,
  picked_up_at TIMESTAMP,
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_borrower FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Item Reports table
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
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_available ON items(available);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower_id ON borrow_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_owner_id ON borrow_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_item_id ON borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_return_deadline ON borrow_requests(return_deadline_datetime);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_picked_up_at ON borrow_requests(picked_up_at);
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter_id ON item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reason ON item_reports(reason);
CREATE INDEX IF NOT EXISTS idx_item_reports_created_at ON item_reports(created_at);

-- Enable Row Level Security (RLS) - will be configured when auth is added
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on items" ON items;
DROP POLICY IF EXISTS "Allow all operations on borrow_requests" ON borrow_requests;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP POLICY IF EXISTS "Allow all operations on item_reports" ON item_reports;

-- For now, create policies that allow all operations (will be restricted when auth is added)
CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on borrow_requests" ON borrow_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on item_reports" ON item_reports FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for messages table
-- Use DO block to handle case where table is already in publication
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Table messages is already in supabase_realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding messages to supabase_realtime: %', SQLERRM;
END $$;

