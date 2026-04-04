
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { applyWatermark } from '@/lib/watermark';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let bytes: Buffer = Buffer.from(buffer);

    // Apply watermark for image files
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      bytes = await applyWatermark(bytes) as Buffer;
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, new Uint8Array(bytes), {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('File uploaded to Supabase:', fileName);

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
