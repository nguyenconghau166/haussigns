import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
-- Create tables for additional content types
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image TEXT,
  category TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  image TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  content TEXT,
  avatar TEXT,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read access (if policies exist they will error so we use DO block or ignore)
-- Since we can't easily check policies in raw SQL without complex queries, 
-- we will try to create them and ignore errors if they exist.
-- But standard SQL doesn't support 'CREATE POLICY IF NOT EXISTS' directly in all versions.
-- We'll skip policy creation for now as RLS defaults to deny unless we enable it.
-- Actually, we enabled RLS. So we NEED policies.
-- Let's try to drop and recreate or use a safe approach.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Projects'
    ) THEN
        CREATE POLICY "Public Read Projects" ON projects FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Services'
    ) THEN
        CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
    END IF;
    
     IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Testimonials'
    ) THEN
        CREATE POLICY "Public Read Testimonials" ON testimonials FOR SELECT USING (true);
    END IF;
END
$$;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
`;

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

  if (error) {
      console.error('Migration v8 failed:', error);
      return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}
