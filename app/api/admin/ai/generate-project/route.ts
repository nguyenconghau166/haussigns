import { NextResponse } from 'next/server';
import { generateProjectDescription } from '@/lib/ai-agents';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, client, location, type, challenges } = body;

        if (!title || !client || !location || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const description = await generateProjectDescription({
            title,
            client,
            location,
            type,
            challenges
        });

        if (!description) {
            return NextResponse.json(
                { error: 'Failed to generate description' },
                { status: 500 }
            );
        }

        return NextResponse.json({ description });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
