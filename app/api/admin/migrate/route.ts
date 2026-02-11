import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
-- Create pages table for dynamic content
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some initial pages if they don't exist
INSERT INTO site_pages (slug, title, content, is_published)
VALUES 
('about', 'About Us', 'Welcome to SignsHaus. We are the leading signage maker in Metro Manila...', true),
('services', 'Our Services', 'We offer a wide range of signage services including...', true),
('portfolio', 'Our Portfolio', 'Check out our latest works...', true),
('contact', 'Contact Us', 'Get in touch with us...', true)
ON CONFLICT (slug) DO NOTHING;
`;

  try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      if (error) {
          console.error('Migration failed:', error);
          // Check if error is specifically about exec_sql missing
          if (error.message.includes('function exec_sql') || error.code === '42883') {
             return NextResponse.json({ 
                 success: false, 
                 error: "Hàm 'exec_sql' không tồn tại trong Database. Vui lòng chạy SQL thủ công hoặc tạo hàm exec_sql." 
             });
          }
          return NextResponse.json({ success: false, error: error.message });
      }
      return NextResponse.json({ success: true });
  } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
  }
}
