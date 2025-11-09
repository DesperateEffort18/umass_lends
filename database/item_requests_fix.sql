-- Fix RLS Policy for Item Requests
-- Run this in your Supabase SQL Editor to fix the RLS policy issue

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to create requests" ON item_requests;
DROP POLICY IF EXISTS "Allow users to view own requests" ON item_requests;
DROP POLICY IF EXISTS "Allow users to view open requests" ON item_requests;
DROP POLICY IF EXISTS "Allow users to update own requests" ON item_requests;
DROP POLICY IF EXISTS "Allow users to accept requests" ON item_requests;

-- Policy: Allow authenticated users to create requests
-- This policy allows any authenticated user to create a request where they are the requester
CREATE POLICY "Allow authenticated users to create requests"
ON item_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to view their own requests
CREATE POLICY "Allow users to view own requests"
ON item_requests
FOR SELECT
TO authenticated
USING (requester_id = auth.uid());

-- Policy: Allow users to view open requests (for lenders to see available requests)
CREATE POLICY "Allow users to view open requests"
ON item_requests
FOR SELECT
TO authenticated
USING (status = 'open');

-- Policy: Allow users to update their own requests
CREATE POLICY "Allow users to update own requests"
ON item_requests
FOR UPDATE
TO authenticated
USING (requester_id = auth.uid())
WITH CHECK (requester_id = auth.uid());

-- Policy: Allow users to accept requests (update status and accepted_by_id)
CREATE POLICY "Allow users to accept requests"
ON item_requests
FOR UPDATE
TO authenticated
USING (status = 'open')
WITH CHECK (accepted_by_id = auth.uid() AND status = 'accepted');

