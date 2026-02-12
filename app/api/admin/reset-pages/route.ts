import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    // We update all pages to have empty content, 
    // but we keep the pages themselves (title, slug) so the structure remains.
    // If the user meant "delete all pages", we would use DELETE FROM site_pages.
    // But usually for "subpages content", resetting content is safer.
    
    // However, the prompt says "xóa hết nội dung trong các subpage đi" which likely means "clear the content field".
    
    const { error } = await supabaseAdmin
      .from('site_pages')
      .update({ content: '', featured_image: '', meta_title: '', meta_description: '' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'All page content cleared.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
