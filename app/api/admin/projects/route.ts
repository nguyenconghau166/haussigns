import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/projects - List all projects
export async function GET() {
    try {
        const { data: projects, error } = await supabaseAdmin
            .from('projects')
            .select(`
        *,
        project_categories (
          category_id,
          categories (name)
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ projects });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/projects - Create a new project
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, slug, client, location, year, description, featured_image, gallery_images, categories } = body;

        // 1. Create Project
        const { data: project, error: projectError } = await supabaseAdmin
            .from('projects')
            .insert({
                title,
                slug,
                client,
                location,
                year,
                description,
                featured_image,
                gallery_images
            })
            .select()
            .single();

        if (projectError) throw projectError;

        // 2. Link Categories
        if (categories && categories.length > 0) {
            const categoryLinks = categories.map((catId: string) => ({
                project_id: project.id,
                category_id: catId
            }));

            const { error: catError } = await supabaseAdmin
                .from('project_categories')
                .insert(categoryLinks);

            if (catError) throw catError;
        }

        return NextResponse.json({ project });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
