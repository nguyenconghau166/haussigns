import { NextResponse } from 'next/server';
import { generateContentGemini } from '@/lib/ai/gemini';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        // We can accept a key in the body to test a specific key, 
        // or just test the stored key if none provided. 
        // For security, let's prefer testing the stored key unless we want to test before saving (which requires sending the key).
        // The settings page sends the *current state* of settings, so we might want to test the key being edited.
        // However, the previous logic sends the whole settings object to save, then tests. 
        // Let's support both: if 'apiKey' is provided, use it. If not, use stored.

        const body = await request.json();
        let apiKey = body.apiKey;

        if (!apiKey) {
            // Fetch from DB if not provided
            const { data } = await supabaseAdmin
                .from('ai_config')
                .select('value')
                .eq('key', 'GEMINI_API_KEY')
                .single();
            apiKey = data?.value;
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'No API Key provided or found' }, { status: 400 });
        }

        // specific test prompt
        const systemPrompt = "You are a connection tester.";
        const userPrompt = "Reply with 'Success' if you receive this.";

        const result = await generateContentGemini(systemPrompt, userPrompt, 'gemini-1.5-flash', apiKey);

        if (result) {
            return NextResponse.json({ success: true, message: result });
        } else {
            return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Gemini Test Error:', error);
        // Extract meaningful error message from Google API error structure if possible
        const errorMessage = error?.response?.data?.error?.message || error?.message || 'Connection failed';
        return NextResponse.json({ error: errorMessage, details: error }, { status: 500 });
    }
}
