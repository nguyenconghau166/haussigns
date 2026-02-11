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

        return (data?.value as AIProvider) || 'openai';
    } catch (error) {
        console.warn('Error fetching AI provider config, defaulting to OpenAI:', error);
        return 'openai';
    }
}

export const generateSmartContent = async (
    systemPrompt: string,
    userPrompt: string,
    model?: string
): Promise<string | null> => {
    const provider = await getPreferredProvider();

    if (provider === 'gemini') {
        // defaults to gemini-1.5-flash if model not specified, or use the model passed if applicable
        const geminiModel = model?.includes('gemini') ? model : 'gemini-1.5-flash';
        return generateContentGemini(systemPrompt, userPrompt, geminiModel);
    }

    // Default to OpenAI
    return generateContentOpenAI(systemPrompt, userPrompt, model);
};
