# Fix: Profile Picture Bucket Not Found

## Error Message
```
Failed to upload profile picture: Bucket not found
```

## Problem
The `profile-pictures` bucket doesn't exist in your Supabase Storage. You need to create it and set up the storage policies.

## Solution: Create the Profile Pictures Bucket

### Step 1: Create the Storage Bucket

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Navigate to Storage**: Click "Storage" in the left sidebar
3. **Create a new bucket**:
   - Click "New bucket" button
   - **Name**: `profile-pictures` (must match exactly)
   - **Public**: ✅ **Yes** (check this box - required for public image URLs)
   - Click "Create bucket"

### Step 2: Set Up Storage Policies

You need to allow users to upload and manage their profile pictures.

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Storage Policies**: 
   - Click on the `profile-pictures` bucket
   - Click on "Policies" tab
   - Click "New Policy"

2. **Create Policy 1: Allow authenticated users to upload profile pictures**

   - **Policy Name**: "Allow authenticated users to upload profile pictures"
   - **Allowed Operation**: INSERT
   - **Policy Definition**:
   ```sql
   (bucket_id = 'profile-pictures')
   ```
   - **Target roles**: `authenticated`
   - Click "Review" then "Save policy"

3. **Create Policy 2: Allow users to update their own profile pictures**

   - **Policy Name**: "Allow users to update own profile pictures"
   - **Allowed Operation**: UPDATE
   - **Policy Definition**:
   ```sql
   (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text)
   ```
   - **Target roles**: `authenticated`
   - Click "Review" then "Save policy"

4. **Create Policy 3: Allow public to read profile pictures**

   - **Policy Name**: "Allow public to read profile pictures"
   - **Allowed Operation**: SELECT
   - **Policy Definition**:
   ```sql
   (bucket_id = 'profile-pictures')
   ```
   - **Target roles**: `public`
   - Click "Review" then "Save policy"

5. **Create Policy 4: Allow users to delete their own profile pictures**

   - **Policy Name**: "Allow users to delete own profile pictures"
   - **Allowed Operation**: DELETE
   - **Policy Definition**:
   ```sql
   (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text)
   ```
   - **Target roles**: `authenticated`
   - Click "Review" then "Save policy"

#### Option B: Using SQL Editor (Alternative)

1. **Go to SQL Editor** in Supabase Dashboard
2. **Click "New Query"**
3. **Copy and paste this SQL**:

```sql
-- Policy 1: Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Policy 2: Allow users to update their own profile pictures
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
CREATE POLICY "Allow users to delete own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text);
```

4. **Click "Run"** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify the Setup

1. **Check the bucket exists**:
   - Go to Storage → You should see `profile-pictures` bucket
   - Make sure it's marked as "Public"

2. **Check the policies**:
   - Click on `profile-pictures` bucket → "Policies" tab
   - You should see 4 policies listed

### Step 4: Test Profile Picture Upload

1. **Go to your app**: Make sure you're signed in
2. **Go to Profile page**: `/profile`
3. **Click "Upload Picture"**
4. **Select an image file**
5. **Save your profile**
6. **The image should upload successfully**

## Troubleshooting

### Issue: "Bucket not found" error persists

**Fix:**
1. Double-check the bucket name is exactly `profile-pictures` (lowercase, with hyphen)
2. Make sure the bucket is created in the correct Supabase project
3. Refresh your browser and try again
4. Check browser console for any other errors

### Issue: "Permission denied" error

**Fix:**
1. Check that all 4 policies are created
2. Make sure the user is authenticated (signed in)
3. Verify the policies allow the operations you're trying to perform

### Issue: Image not displaying

**Fix:**
1. Make sure the bucket is set to **Public**
2. Check the image URL in the database
3. Verify the public URL is accessible in browser

## Quick Checklist

- [ ] `profile-pictures` bucket created in Supabase Storage
- [ ] Bucket is set to **Public**
- [ ] Policy 1: INSERT policy for authenticated users
- [ ] Policy 2: UPDATE policy for users' own pictures
- [ ] Policy 3: SELECT policy for public access
- [ ] Policy 4: DELETE policy for users' own pictures
- [ ] User is signed in
- [ ] Can upload profile picture
- [ ] Profile picture displays correctly

## After Setup

Once you've created the bucket and policies, profile picture uploads should work. Users will be able to:
- Upload profile pictures
- Update their profile pictures
- View profile pictures (public access)
- Delete their own profile pictures

## Note

The profile pictures are stored in the bucket with the path: `{userId}/profile_{timestamp}.{ext}`

This ensures each user's pictures are organized in their own folder, and users can only modify/delete their own pictures.

