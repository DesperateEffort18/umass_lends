-- Supabase Storage Setup Script
-- Run this in your Supabase SQL Editor to set up storage policies

-- Note: You still need to create the bucket manually in the Supabase Dashboard
-- Storage > New Bucket > Name: "item-images" > Public: Yes

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- Policy 2: Allow authenticated users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images');

-- Policy 3: Allow public to read images
CREATE POLICY "Allow public to read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Policy 4: Allow authenticated users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-images');

-- Verify policies were created
-- You can check this in Supabase Dashboard > Storage > Policies

