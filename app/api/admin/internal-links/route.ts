import { NextResponse } from 'next/server';
import { scanAndGenerateRules, applyInternalLinks } from '@/lib/internal-linking';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        if (action === 'scan') {
            const result = await scanAndGenerateRules();
            return NextResponse.json({ success: true, data: result });
        }

        if (action === 'apply') {
            const result = await applyInternalLinks();
            return NextResponse.json({ success: true, data: result });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Return stats or rules
    // For now simple stats
    const { count: rulesCount } = await supabaseAdmin.from('internal_linking_rules').select('*', { count: 'exact', head: true });

    return NextResponse.json({
        success: true,
        stats: {
            rules: rulesCount || 0
        }
    });
}
