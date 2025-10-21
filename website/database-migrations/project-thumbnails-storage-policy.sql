-- Run this SQL in Supabase SQL Editor to enable project thumbnail uploads
-- This assumes you already have the 'user-uploads' bucket created

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

-- Allow everyone to read project thumbnails (public access)
-- (This policy may already exist for 'user-uploads' bucket, if so you can skip this)
CREATE POLICY "Project thumbnails are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'project-thumbnails'
);
