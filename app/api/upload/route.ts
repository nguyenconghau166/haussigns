
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge'; // Optional: Use Edge if supported, otherwise Node.js

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('File uploaded to Supabase:', fileName);

    // Get public URL

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
