# Supabase Storage Setup Guide

This guide walks you through setting up the required Supabase Storage bucket for avatar uploads.

---

## Quick Setup (5 minutes)

### Step 1: Create Storage Bucket

1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket** button
4. Fill in the details:
   - **Name**: `user-uploads`
   - **Public bucket**: Toggle ON (checked)
   - **File size limit**: 50MB (default is fine)
   - **Allowed MIME types**: Leave empty (we validate in frontend)
5. Click **Create bucket**

✅ You should now see `user-uploads` in your buckets list

---

### Step 2: Configure Storage Policies

The bucket needs policies to control who can upload, read, update, and delete files.

#### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste the following SQL:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads'
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads'
);

-- Allow everyone to read avatars (public access for avatar URLs)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Allow authenticated users to upload project thumbnails
CREATE POLICY "Users can upload project thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'project-thumbnails'
);

-- Allow users to update their own project thumbnails
CREATE POLICY "Users can update project thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'project-thumbnails'
);

-- Allow users to delete their own project thumbnails
CREATE POLICY "Users can delete project thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'project-thumbnails'
);
```

4. Click **Run** to execute
5. You should see "Success. No rows returned"

#### Option B: Using Storage UI (Manual)

If you prefer the UI:

1. Go to **Storage** → **user-uploads** bucket
2. Click on **Policies** tab
3. Create 4 policies using the **Create policy** button:

**Policy 1: Upload (INSERT)**
- Name: `Users can upload their own avatars`
- Policy command: `INSERT`
- Target roles: `authenticated`
- WITH CHECK: 
  ```sql
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars'
  ```

**Policy 2: Read (SELECT)**
- Name: `Avatars are publicly accessible`
- Policy command: `SELECT`
- Target roles: `public`
- USING:
  ```sql
  bucket_id = 'user-uploads'
  ```

**Policy 3: Update (UPDATE)**
- Name: `Users can update their own avatars`
- Policy command: `UPDATE`
- Target roles: `authenticated`
- USING:
  ```sql
  bucket_id = 'user-uploads'
  ```

**Policy 4: Delete (DELETE)**
- Name: `Users can delete their own avatars`
- Policy command: `DELETE`
- Target roles: `authenticated`
- USING:
  ```sql
  bucket_id = 'user-uploads'
  ```

---

### Step 3: Verify Setup

To verify everything is working:

1. Go to **Storage** → **user-uploads**
2. You should see the bucket with **Public** badge
3. Click on **Policies** tab
4. You should see 4 policies listed

---

## Testing Avatar Upload

Once the bucket is set up, test the avatar upload feature:

1. Navigate to your app's Settings page (`/settings`)
2. Click on the Profile tab
3. Click **Change Avatar** button
4. Select an image file (under 5MB)
5. Wait for upload to complete
6. Avatar should appear immediately

### Troubleshooting Upload Issues:

**Error: "Failed to upload avatar"**
- Check that `user-uploads` bucket exists
- Verify bucket is set to Public
- Check storage policies are active
- View browser console for detailed error

**Image doesn't appear after upload**
- Check the public URL in browser console
- Verify bucket is public (not private)
- Check browser network tab for failed requests

**"Permission denied" error**
- User must be authenticated (logged in)
- Check INSERT policy is active
- Verify policy allows `avatars` folder

---

## Storage Structure

Avatars are stored with this structure:

```
user-uploads/
└── avatars/
    ├── {userId}-{timestamp}.jpg
    ├── {userId}-{timestamp}.png
    └── {userId}-{timestamp}.webp
```

**Example**:
```
user-uploads/avatars/550e8400-e29b-41d4-a716-446655440000-1729094400000.jpg
```

- `550e8400-e29b-41d4-a716-446655440000` = User ID
- `1729094400000` = Unix timestamp
- `.jpg` = File extension

---

## Advanced Configuration (Optional)

### Size Limits

Current frontend validation: 5MB max

To enforce on backend (bucket level):

1. Go to Storage → user-uploads → **Configuration**
2. Set **File size limit**: `5242880` (5MB in bytes)
3. Save changes

### MIME Type Restrictions

To only allow images:

1. Go to Storage → user-uploads → **Configuration**
2. Set **Allowed MIME types**: 
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   ```
3. Save changes

### File Path Restrictions

Current policy allows uploads to `avatars/` folder only.

To add more folders (e.g., for project thumbnails):

```sql
-- Allow project thumbnails
CREATE POLICY "Users can upload project thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'project-thumbnails'
);
```

---

## Security Best Practices

✅ **DO**:
- Keep bucket public (avatars need to be accessible)
- Validate file size and type in frontend
- Use authenticated policies for uploads
- Generate unique filenames (user-id + timestamp)
- Delete old avatars when uploading new ones

❌ **DON'T**:
- Allow unauthenticated uploads
- Skip file validation
- Use user-provided filenames (security risk)
- Store sensitive files in public buckets

---

## Cost Considerations

Supabase Storage pricing (as of 2025):

**Free Tier**:
- 1 GB storage
- 2 GB bandwidth per month

**Pro Plan** ($25/month):
- 100 GB storage included
- 200 GB bandwidth included
- $0.021/GB storage after
- $0.09/GB bandwidth after

**Estimate for 1000 users**:
- Avatar size: ~200 KB average
- Total storage: 200 MB
- Well within free tier! ✅

---

## Monitoring Storage Usage

To check your storage usage:

1. Go to **Settings** → **Usage**
2. Scroll to **Storage** section
3. View:
   - Total storage used
   - Bandwidth used
   - Number of files

Set up alerts:

1. Go to **Settings** → **Billing**
2. Set **Storage alert threshold**: 80%
3. Add your email for notifications

---

## Migration Notes

If you already have avatars in a different system:

1. **Export** old avatars
2. **Rename** to new format: `{userId}-{timestamp}.{ext}`
3. **Upload** via Supabase CLI or dashboard
4. **Update** `user_profiles.avatar_url` in database

**Bulk upload via CLI**:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Upload files
supabase storage upload user-uploads/avatars/ ./avatars/*
```

---

## Cleanup Old Avatars

Avatars are automatically deleted when:
- User uploads a new avatar (old one is removed)
- User removes avatar via UI
- User deletes their account (cascade delete)

**Manual cleanup** (if needed):
```sql
-- Find orphaned avatars (no matching user)
SELECT *
FROM storage.objects
WHERE bucket_id = 'user-uploads'
  AND (storage.foldername(name))[1] = 'avatars'
  AND NOT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE avatar_url LIKE '%' || (storage.foldername(name))[2] || '%'
  );
```

---

## Support

If you encounter issues:

1. Check [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
2. Review [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
3. Ask in [Supabase Discord](https://discord.supabase.com)

---

**Setup Complete!** ✅

Your avatar upload system is now fully functional. Users can upload, update, and remove profile pictures seamlessly.

---

**Last Updated**: October 16, 2025  
**Version**: 1.0
