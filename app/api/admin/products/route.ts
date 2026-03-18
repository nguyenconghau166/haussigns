
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enforcePublishGate } from '@/lib/publish-gate';

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
    const { name, slug, description, content, meta_title, meta_description, cover_image, is_published, features, gallery_images } = body;

    if (is_published === true) {
        const gate = await enforcePublishGate({
            title: name || '',
            description: description || '',
            content: content || '',
            metaTitle: meta_title || '',
            metaDescription: meta_description || '',
            contentType: 'product',
            entityTable: 'products'
        });

        if (!gate.allowed) {
            return NextResponse.json({
                error: `Publish blocked: Content quality score ${gate.qa.overall} is below required ${gate.minScore}.`,
                qa: gate.qa,
                minScore: gate.minScore
            }, { status: 422 });
        }
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .insert([{ name, slug, description, content, meta_title, meta_description, cover_image, is_published, features, gallery_images }])
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
}
