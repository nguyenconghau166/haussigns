import { generateContent as generateContentOpenAI } from '../openai';
import { generateContentGemini } from './gemini';
import { supabaseAdmin } from '../supabase';

export type AIProvider = 'openai' | 'gemini';

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
    const provider = await getPreferredProvider();

    if (provider === 'gemini') {
        // use model from config if not specified
        const geminiModel = model?.includes('gemini') ? model : undefined;
        return generateContentGemini(systemPrompt, userPrompt, geminiModel, undefined, options);
    }

    // Default to OpenAI
    return generateContentOpenAI(systemPrompt, userPrompt, model);
};
