-- Add Private Conversations Support to Messages
-- This migration adds participant_id to messages table to enable one-to-one private conversations
-- Run this in your Supabase SQL Editor

-- Step 1: Add participant_id column to messages table
-- This identifies the other participant in the conversation (owner or borrower)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_participant_id ON messages(participant_id);
CREATE INDEX IF NOT EXISTS idx_messages_item_participant ON messages(item_id, participant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_participant ON messages(sender_id, participant_id);

-- Step 3: Update existing messages to set participant_id
-- For existing messages from borrowers: participant_id = owner
-- For existing messages from owners: find a borrower from other messages
UPDATE messages m
SET participant_id = i.owner_id
FROM items i
WHERE m.item_id = i.id 
  AND m.participant_id IS NULL
  AND m.sender_id != i.owner_id; -- Only update messages from borrowers

-- For messages sent by owners, find a borrower from other messages for the same item
UPDATE messages m
SET participant_id = (
  SELECT DISTINCT sender_id 
  FROM messages m2 
  WHERE m2.item_id = m.item_id 
    AND m2.sender_id != m.sender_id 
  LIMIT 1
)
FROM items i
WHERE m.item_id = i.id 
  AND m.participant_id IS NULL
  AND m.sender_id = i.owner_id; -- Messages from owners

-- Delete any messages where we still can't determine participant_id
DELETE FROM messages m
WHERE m.participant_id IS NULL;

-- Step 4: Delete orphaned messages (messages without valid items)
DELETE FROM messages m
WHERE NOT EXISTS (
  SELECT 1 FROM items i WHERE i.id = m.item_id
);

-- Step 5: Make participant_id NOT NULL after backfilling
ALTER TABLE messages 
ALTER COLUMN participant_id SET NOT NULL;

-- Step 6: Clean up any messages where participant_id equals sender_id
DELETE FROM messages
WHERE participant_id = sender_id;

-- Step 7: Add constraint to ensure participant_id is different from sender_id
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS check_participant_not_sender;
ALTER TABLE messages
ADD CONSTRAINT check_participant_not_sender 
CHECK (participant_id != sender_id);

-- Step 8: Update RLS policies for private conversations
DROP POLICY IF EXISTS "Users can see their own conversations" ON messages;
CREATE POLICY "Users can see their own conversations" ON messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = participant_id
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

