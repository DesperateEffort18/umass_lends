-- Supabase Storage Setup Script for Profile Pictures
-- Run this in your Supabase SQL Editor to set up storage policies

-- Note: You still need to create the bucket manually in the Supabase Dashboard
-- Storage > New Bucket > Name: "profile-pictures" > Public: Yes

-- Policy 1: Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Policy 2: Allow users to update their own profile pictures
-- Users can only update files in their own folder (userId matches auth.uid())
CREATE POLICY "Allow users to update own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy 3: Allow public to read profile pictures
CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Policy 4: Allow users to delete their own profile pictures
-- Users can only delete files in their own folder (userId matches auth.uid())
CREATE POLICY "Allow users to delete own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verify policies were created
-- You can check this in Supabase Dashboard > Storage > profile-pictures > Policies

