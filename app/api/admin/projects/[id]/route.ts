import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/admin/projects/[id]
export async function GET(req: Request, props: RouteParams) {
    const params = await props.params;
    try {
        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .select(`
        *,
        project_categories (
          category_id
        )
      `)
            .eq('id', params.id)
            .single();

        if (error) throw error;

        // Transform categories to simple array of IDs
        const formattedProject = {
            ...project,
            categories: project.project_categories.map((pc: any) => pc.category_id)
        };

        return NextResponse.json({ project: formattedProject });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/admin/projects/[id]
export async function PUT(req: Request, props: RouteParams) {
    const params = await props.params;
    try {
        const body = await req.json();
        const { title, slug, client, location, year, description, featured_image, gallery_images, categories } = body;

        // 1. Update Project Fields
        const { error: updateError } = await supabaseAdmin
            .from('projects')
            .update({
                title,
                slug,
                client,
                location,
                year,
                description,
                featured_image,
                gallery_images,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id);

        if (updateError) throw updateError;

        // 2. Update Categories (Delete all then insert new)
        // First, delete existing
        await supabaseAdmin
            .from('project_categories')
            .delete()
            .eq('project_id', params.id);

        // Then insert new if any
        if (categories && categories.length > 0) {
            const categoryLinks = categories.map((catId: string) => ({
                project_id: params.id,
                category_id: catId
            }));

            const { error: catError } = await supabaseAdmin
                .from('project_categories')
                .insert(categoryLinks);

            if (catError) throw catError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/projects/[id]
export async function DELETE(req: Request, props: RouteParams) {
    const params = await props.params;
    try {
        const { error } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
