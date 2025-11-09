# Private Conversations Setup

This document explains how to set up private one-to-one conversations for the UMass Lends platform.

## Overview

The messaging system has been updated to support private one-to-one conversations:
- **Borrowers** can have a private conversation with the item owner
- **Owners** can see all their conversations with different borrowers
- Each conversation is private - borrowers cannot see other borrowers' messages

## Database Migration

Run the migration script to add `participant_id` to the messages table:

```sql
-- Run this in your Supabase SQL Editor
-- File: database/add_private_conversations.sql
```

This migration will:
1. Add `participant_id` column to the `messages` table
2. Backfill existing messages with the correct `participant_id`
3. Add constraints to ensure data integrity
4. Update RLS policies for private conversations

## How It Works

### For Borrowers
- When a borrower sends a message, `participant_id` is automatically set to the item owner
- Borrowers only see messages where they are either the `sender_id` or `participant_id`
- This ensures they only see their own conversation with the owner

### For Owners
- Owners can see all messages for their items (all conversations)
- When an owner sends a message, the system:
  1. Checks if `participant_id` is provided in the request (for replying to a specific borrower)
  2. If not provided, finds the most recent conversation to determine which borrower to message
  3. If no conversation exists, returns an error asking the owner to wait for a borrower to message first

## API Changes

### POST /api/messages
- Added optional `participant_id` field in request body
- Automatically determines `participant_id` based on user role:
  - Borrowers: `participant_id` = item owner
  - Owners: `participant_id` = borrower (from request or most recent conversation)

### GET /api/messages?itemId=xxx
- Returns filtered messages based on user role:
  - **Owners**: All messages for the item (all conversations)
  - **Borrowers**: Only messages where they are involved with the owner
- Handles unauthenticated users gracefully (returns empty messages)

## Frontend Changes

### ItemDetail Component
- Shows "All Conversations" for owners
- Shows "Private Conversation" for borrowers
- Displays helpful message when owner tries to send first message without existing conversation
- Handles authentication errors gracefully

## Testing

1. **As a Borrower:**
   - Sign in as a borrower
   - Navigate to an item detail page
   - Send a message - it should create a private conversation with the owner
   - You should only see your own messages with the owner

2. **As an Owner:**
   - Sign in as an item owner
   - Navigate to your item detail page
   - You should see "All Conversations" header
   - If no messages exist, you'll see a message asking you to wait for a borrower to message first
   - Once a borrower messages you, you can reply and see all conversations

3. **Multiple Borrowers:**
   - Have multiple borrowers message the same item
   - As the owner, you should see all conversations
   - Each borrower should only see their own conversation

## Troubleshooting

### "No conversations yet" error when owner tries to send message
- This is expected behavior - owners need to wait for a borrower to initiate the conversation
- Alternatively, owners can message borrowers from the "Requests" page

### Messages not showing up
- Check that the migration script was run successfully
- Verify that `participant_id` column exists in the messages table
- Check browser console for any API errors

### Authentication errors
- The API handles unauthenticated users gracefully by returning empty messages
- Make sure you're signed in to send messages
- Check that your auth token is valid

