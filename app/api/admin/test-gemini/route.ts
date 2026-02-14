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
        // List of models to try in order of preference
        const candidateModels = [
            'gemini-3-flash-preview',
            'gemini-3-pro-preview',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ];

        let lastError;
        let workingModel = null;
        let successResult = null;

        const systemPrompt = "You are a connection tester.";
        const userPrompt = "Reply with 'Success' if you receive this.";

        // Try each model until one works
        for (const model of candidateModels) {
            try {
                console.log(`Testing Gemini model: ${model}`);
                const result = await generateContentGemini(systemPrompt, userPrompt, model, apiKey);
                if (result) {
                    workingModel = model;
                    successResult = result;
                    break; // Stop if successful
                }
            } catch (error: any) {
                console.warn(`Failed to connect with model ${model}:`, error.message);
                lastError = error;
                // Continue to next model
            }
        }

        if (workingModel && successResult) {
            return NextResponse.json({
                success: true,
                message: successResult,
                model: workingModel
            });
        } else {
            // If all failed, return the last error
            console.error('All Gemini models failed.');
            const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || 'Connection failed for all models';
            return NextResponse.json({ error: errorMessage, details: lastError }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Gemini Test Error:', error);
        // Extract meaningful error message from Google API error structure if possible
        const errorMessage = error?.response?.data?.error?.message || error?.message || 'Connection failed';
        return NextResponse.json({ error: errorMessage, details: error }, { status: 500 });
    }
}
