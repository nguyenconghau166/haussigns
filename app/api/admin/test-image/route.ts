import { NextResponse } from 'next/server';
import { generateProjectImage } from '@/lib/image-gen';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    const diagnostics: Record<string, unknown> = {};

    // Step 1: Check what's in the DB
    try {
        const { data: configs } = await supabaseAdmin
            .from('ai_config')
            .select('key, value')
            .in('key', ['google_api_key', 'GEMINI_API_KEY', 'image_provider']);

        if (configs) {
            for (const c of configs) {
                const val = c.value || '';
                diagnostics[`db_${c.key}`] = val.length > 10
                    ? `${val.substring(0, 8)}... (len=${val.length})`
                    : val || 'EMPTY';
            }
        }
    } catch (e) {
        diagnostics.db_error = String(e);
    }

    diagnostics.env_GEMINI_API_KEY = process.env.GEMINI_API_KEY
        ? `Set (${process.env.GEMINI_API_KEY.substring(0, 8)}...)`
        : 'NOT SET';

    // Step 2: Actually test generateProjectImage
    const startMs = Date.now();
    try {
        const result = await generateProjectImage(
            'a modern LED signage installed on a glass building facade, professional photography'
        );
        diagnostics.generate_time_ms = Date.now() - startMs;
        diagnostics.generate_result = result ? `SUCCESS (url: ${result.substring(0, 80)}...)` : 'NULL (failed)';
        diagnostics.success = !!result;
    } catch (e) {
        diagnostics.generate_time_ms = Date.now() - startMs;
        diagnostics.generate_error = e instanceof Error ? e.message : String(e);
        diagnostics.success = false;
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
