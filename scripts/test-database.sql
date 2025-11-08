-- Test queries to verify database schema was created correctly
-- Run these in Supabase SQL Editor after running schema.sql

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'items', 'borrow_requests', 'messages')
ORDER BY table_name;

-- 2. Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'items', 'borrow_requests', 'messages')
ORDER BY table_name, ordinal_position;

-- 3. Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'items', 'borrow_requests', 'messages')
ORDER BY tablename, indexname;

-- 4. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'items', 'borrow_requests', 'messages');

-- 5. Test insert into users table
INSERT INTO users (id, email, name) 
VALUES ('dev-user'::uuid, 'dev-user@umass.edu', 'Dev User')
ON CONFLICT (id) DO NOTHING;

-- 6. Verify user was created
SELECT * FROM users WHERE id = 'dev-user'::uuid;

-- 7. Test insert into items table
INSERT INTO items (owner_id, title, description, category, condition, available)
VALUES (
  'dev-user'::uuid,
  'Test Laptop',
  'This is a test item',
  'Electronics',
  'Good',
  true
)
ON CONFLICT DO NOTHING;

-- 8. Verify item was created
SELECT * FROM items WHERE owner_id = 'dev-user'::uuid;

-- 9. Check if realtime is enabled for messages
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';

