-- ============================================================
-- Syncra: Supabase Storage Bucket Setup
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- 1. Create the candidate-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-photos',
  'candidate-photos',
  true,                    -- publicly readable (no auth needed to view photos)
  5242880,                 -- 5 MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated/anon users to UPLOAD photos (INSERT)
CREATE POLICY "Allow uploads to candidate-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-photos');

-- 3. Allow anyone to READ / VIEW photos (SELECT)
CREATE POLICY "Allow public reads from candidate-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-photos');

-- 4. Allow deleting candidate photos (DELETE)
CREATE POLICY "Allow delete from candidate-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'candidate-photos');

-- ============================================================
-- Optional: Add start_time column to elections table if missing
-- ============================================================
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
