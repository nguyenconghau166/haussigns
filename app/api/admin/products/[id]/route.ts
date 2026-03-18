
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enforcePublishGate } from '@/lib/publish-gate';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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
            entityId: id,
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
        .update({
            name,
            slug,
            description,
            content,
            meta_title,
            meta_description,
            cover_image,
            is_published,
            features,
            gallery_images,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
