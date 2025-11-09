# Profile Page Setup Guide

## Overview

The Profile page allows users to:
- Upload a circular profile picture
- Link payment methods (Venmo, CashApp, Zelle)
- Change their password

## Database Setup

### Step 1: Run the Profile Schema Migration

Run the SQL script in your Supabase SQL Editor:

```sql
-- File: database/profile_schema.sql
```

This will add the following columns to the `users` table:
- `profile_picture_url` - URL of the user's profile picture
- `venmo_username` - Venmo username
- `cashapp_username` - CashApp username
- `zelle_email` - Zelle email address
- `updated_at` - Timestamp for when profile was last updated

### Step 2: Create Storage Bucket for Profile Pictures

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket named `profile-pictures`
3. Make it **Public** (required for profile picture URLs)
4. Set up storage policies:

```sql
-- Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Allow users to update own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow public to read profile pictures
CREATE POLICY "Allow public to read profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

## Features

### Profile Picture
- **Circular display** - Profile pictures are displayed in a circular format
- **Upload/Change** - Users can upload or change their profile picture
- **Remove** - Users can remove their profile picture
- **Validation** - Images must be less than 5MB
- **Preview** - Real-time preview before saving

### Payment Methods
- **Venmo** - Link Venmo username
- **CashApp** - Link CashApp username
- **Zelle** - Link Zelle email address
- **Optional** - All payment methods are optional

### Password Change
- **Current password verification** - Must enter current password
- **New password validation** - Minimum 6 characters
- **Password confirmation** - Must match new password
- **Secure** - Uses Supabase Auth for password updates

## API Endpoints

### GET /api/profile
Get the current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "profile_picture_url": "...",
    "venmo_username": "...",
    "cashapp_username": "...",
    "zelle_email": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### PUT /api/profile
Update the current user's profile.

**Request Body:**
```json
{
  "profile_picture_url": "...",
  "venmo_username": "...",
  "cashapp_username": "...",
  "zelle_email": "..."
}
```

### POST /api/profile/change-password
Change the user's password.

**Request Body:**
```json
{
  "current_password": "...",
  "new_password": "..."
}
```

## Usage

1. **Navigate to Profile**: Click "Profile" in the navbar (when signed in)
2. **Upload Profile Picture**: Click "Upload Picture" and select an image
3. **Add Payment Methods**: Enter your Venmo, CashApp, or Zelle information
4. **Save Profile**: Click "Save Profile" to save changes
5. **Change Password**: Enter current password and new password, then click "Change Password"

## File Structure

```
src/
├── pages/
│   └── Profile.jsx          # Profile page component
├── utils/
│   ├── api.js               # Profile API functions
│   └── imageUpload.js       # Profile picture upload utility
app/api/
├── profile/
│   ├── route.ts             # GET/PUT profile endpoints
│   └── change-password/
│       └── route.ts         # Password change endpoint
database/
└── profile_schema.sql       # Database migration
```

## Troubleshooting

### Profile picture not uploading
- Check that `profile-pictures` bucket exists
- Verify bucket is public
- Check storage policies are set up correctly
- Ensure user is authenticated

### Password change failing
- Verify current password is correct
- Ensure new password is at least 6 characters
- Check that passwords match

### Profile not loading
- Check user is authenticated
- Verify database schema is updated
- Check API endpoint is accessible

## Security Notes

- Profile pictures are stored in public bucket (accessible to all)
- Payment method information is stored in database (only visible to user)
- Password changes require current password verification
- All API endpoints require authentication

