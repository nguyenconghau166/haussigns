-- MIGRATION v13
-- Create storage bucket for images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage.objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 
-- Commented out as it often causes permission errors if not superuser/owner. 
-- RLS is usually enabled by default on storage.objects.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Images'
    ) THEN
        CREATE POLICY "Public Read Images" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'images');
    END IF;
END
$$;

-- Allow authenticated/service role to upload images
-- Service role bypasses RLS by default, but this is good for explicit auth users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Authenticated Upload Images'
    ) THEN
        CREATE POLICY "Authenticated Upload Images" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'images');
    END IF;
END
$$;

-- Allow authenticated/service role to update images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Authenticated Update Images'
    ) THEN
        CREATE POLICY "Authenticated Update Images" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'images');
    END IF;
END
$$;

-- Allow authenticated/service role to delete images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Authenticated Delete Images'
    ) THEN
        CREATE POLICY "Authenticated Delete Images" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'images');
    END IF;
END
$$;
