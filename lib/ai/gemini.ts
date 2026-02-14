import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../supabase';

// Helper to fetch Gemini Key and Model from DB
export const getGeminiConfig = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('ai_config')
            .select('key, value')
            .in('key', ['GEMINI_API_KEY', 'GEMINI_MODEL']);

        if (error) {
            console.warn('Failed to fetch Gemini config from Supabase:', error);
            return { apiKey: process.env.GEMINI_API_KEY || null, model: 'gemini-2.0-flash' };
        }

        const configMap = data.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        return {
            apiKey: process.env.GEMINI_API_KEY || configMap['GEMINI_API_KEY'],
            model: configMap['GEMINI_MODEL'] || 'gemini-2.0-flash'
        };
    } catch (err) {
        console.error('Error fetching Gemini Config:', err);
        return { apiKey: process.env.GEMINI_API_KEY || null, model: 'gemini-2.0-flash' };
    }
};

// Initialize Gemini client (will be re-initialized per request with user's key if needed)
// function to get client
const getClient = (apiKey: string) => new GoogleGenerativeAI(apiKey);

export const generateContentGemini = async (
    systemPrompt: string,
    userPrompt: string,
    modelName?: string,
    apiKey?: string
): Promise<string | null> => {
    const config = await getGeminiConfig();
    const key = apiKey || config.apiKey;
    // Prefer passed modelName, then DB config, then default
    const finalModelName = modelName || config.model || 'gemini-2.0-flash';

    if (!key) {
        console.error('Missing Gemini API Key');
        throw new Error('Missing Gemini API Key in Environment or Supabase ai_config.');
    }

    try {
        const genAI = getClient(key);
        const model = genAI.getGenerativeModel({ model: finalModelName });

        const prompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating content with Gemini:', error);
        throw error;
    }
};
