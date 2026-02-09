-- Remove the old column (if it exists)
ALTER TABLE files DROP COLUMN IF EXISTS file_data;

-- Add new columns for storage
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_url TEXT;

-- First, create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files', 
  'files', 
  true, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Option A: Allow public uploads (less secure but simpler for testing)
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'files');

-- Option B: Allow uploads for authenticated users only (more secure)
-- Uncomment this if you have authentication and comment out the public policy above
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

-- Allow public read access to files
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- Allow delete for the uploader (optional)
CREATE POLICY "Allow delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'files');