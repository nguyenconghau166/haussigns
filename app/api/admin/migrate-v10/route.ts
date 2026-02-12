import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  pros JSONB DEFAULT '[]'::JSONB,
  cons JSONB DEFAULT '[]'::JSONB,
  best_for TEXT,
  description TEXT,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial data
INSERT INTO materials (slug, name, image, pros, cons, best_for, is_published)
VALUES 
('acrylic', 'Acrylic', 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop', 
 '["Versatile shapes", "Many color options", "Lightweight", "High gloss finish"]', 
 '["Can scratch easily", "Pricey for large coverage"]', 
 'Indoor logos, Lighted letters, Retail stores', true),

('stainless-steel', 'Stainless Steel 304', 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop', 
 '["Rust-proof", "Premium look (Gold/Mirror)", "Extremely durable", "Weather resistant"]', 
 '["Heavy", "More expensive", "Harder to shape complex curves"]', 
 'Corporate buildings, Outdoor monuments, Luxury brands', true),

('panaflex', 'Panaflex', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop', 
 '["Very affordable", "Great for huge sizes", "Easy to replace face", "Full color print"]', 
 '["Less premium look", "Can fade over time (3-5 years)"]', 
 'Grocery stores, Roadside signage, Temporary campaigns', true),

('acp', 'Aluminum Composite (ACP)', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop', 
 '["Perfect flat surface", "Lightweight but rigid", "Modern architectural look"]', 
 '["Limited texture options", "Joint lines visible"]', 
 'Building cladding, Backing for letters, Pylons', true)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Materials'
    ) THEN
        CREATE POLICY "Public Read Materials" ON materials FOR SELECT USING (true);
    END IF;
END
$$;
`;

  try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      if (error) {
          console.error('Migration v10 failed:', error);
          if (error.message.includes('function exec_sql') || error.code === '42883') {
             return NextResponse.json({ 
                 success: false, 
                 error: "Hàm 'exec_sql' không tồn tại. Vui lòng chạy SQL thủ công." 
             });
          }
          return NextResponse.json({ success: false, error: error.message });
      }
      return NextResponse.json({ success: true });
  } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
  }
}
