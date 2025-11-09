-- Item Requests Schema
-- Run this in your Supabase SQL Editor to add item request functionality
-- This allows users to request items they need, and lenders can accept and list them

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'fulfilled', 'cancelled')),
  accepted_by_id UUID,
  created_item_id UUID, -- The item created when request was accepted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_accepted_by FOREIGN KEY (accepted_by_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_created_item FOREIGN KEY (created_item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_item_requests_requester_id ON item_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status);
CREATE INDEX IF NOT EXISTS idx_item_requests_category ON item_requests(category);
CREATE INDEX IF NOT EXISTS idx_item_requests_created_at ON item_requests(created_at);

-- Enable Row Level Security
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to create requests
DROP POLICY IF EXISTS "Allow authenticated users to create requests" ON item_requests;
CREATE POLICY "Allow authenticated users to create requests"
ON item_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

-- Policy: Allow users to view their own requests
DROP POLICY IF EXISTS "Allow users to view own requests" ON item_requests;
CREATE POLICY "Allow users to view own requests"
ON item_requests
FOR SELECT
TO authenticated
USING (requester_id = auth.uid());

-- Policy: Allow users to view open requests (for lenders to see available requests)
DROP POLICY IF EXISTS "Allow users to view open requests" ON item_requests;
CREATE POLICY "Allow users to view open requests"
ON item_requests
FOR SELECT
TO authenticated
USING (status = 'open');

-- Policy: Allow users to update their own requests
DROP POLICY IF EXISTS "Allow users to update own requests" ON item_requests;
CREATE POLICY "Allow users to update own requests"
ON item_requests
FOR UPDATE
TO authenticated
USING (requester_id = auth.uid());

-- Policy: Allow users to accept requests (update status and accepted_by_id)
DROP POLICY IF EXISTS "Allow users to accept requests" ON item_requests;
CREATE POLICY "Allow users to accept requests"
ON item_requests
FOR UPDATE
TO authenticated
USING (status = 'open')
WITH CHECK (accepted_by_id = auth.uid() AND status = 'accepted');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_item_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_item_requests_updated_at ON item_requests;
CREATE TRIGGER update_item_requests_updated_at
    BEFORE UPDATE ON item_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_item_requests_updated_at();

