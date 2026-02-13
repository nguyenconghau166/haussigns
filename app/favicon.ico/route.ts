import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data } = await supabase
            .from('ai_config')
            .select('value')
            .eq('key', 'site_favicon')
            .single();

        if (data?.value) {
            return NextResponse.redirect(new URL(data.value));
        }

        // Fallback URL
        const url = new URL(request.url);
        const fallback = new URL('/logo-web.png', url.origin);
        return NextResponse.redirect(fallback);

    } catch (error) {
        const url = new URL(request.url);
        return NextResponse.redirect(new URL('/logo-web.png', url.origin));
    }
}
