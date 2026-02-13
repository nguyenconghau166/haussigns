
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { name, slug, description, content, cover_image, is_published, features, gallery_images } = body;

    const { data, error } = await supabaseAdmin
        .from('products')
        .insert([{ name, slug, description, content, cover_image, is_published, features, gallery_images }])
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
}
