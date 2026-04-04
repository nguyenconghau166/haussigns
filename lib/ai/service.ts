import { generateContent as generateContentOpenAI } from '../openai';
import { generateContentGemini } from './gemini';
import { generateContentClaude } from './claude';
import { inferProvider } from './provider-utils';
import type { AIProvider } from './provider-utils';
import { supabaseAdmin } from '../supabase';

export type { AIProvider };

async function getPreferredProvider(): Promise<AIProvider> {
    try {
        const { data } = await supabaseAdmin
            .from('ai_config')
            .select('value')
            .eq('key', 'ai_provider')
            .single();

        return (data?.value as AIProvider) || 'gemini';
    } catch (error) {
        console.warn('Error fetching AI provider config, defaulting to Gemini:', error);
        return 'gemini';
    }
}

export const generateSmartContent = async (
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: { temperature?: number; topK?: number; topP?: number }
): Promise<string | null> => {
    // If a model is specified, infer provider from it; otherwise use global config
    const provider = model
        ? inferProvider(model, await getPreferredProvider())
        : await getPreferredProvider();

    if (provider === 'anthropic') {
        return generateContentClaude(systemPrompt, userPrompt, model, undefined, options);
    }

    if (provider === 'gemini') {
        return generateContentGemini(systemPrompt, userPrompt, model, undefined, options);
    }

    // Default to OpenAI
    return generateContentOpenAI(systemPrompt, userPrompt, model);
};
