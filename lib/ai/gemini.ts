import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../supabase';

// Helper to fetch Gemini Key
export const getGeminiKey = async () => {
    try {
        // Try to get from Env first (dev override), then Database
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

        const { data, error } = await supabaseAdmin
            .from('ai_config')
            .select('value')
            .eq('key', 'GEMINI_API_KEY')
            .single();

        if (error || !data?.value) {
            console.warn('Failed to fetch Gemini API Key from Supabase:', error);
            return null;
        }

        return data.value;
    } catch (err) {
        console.error('Error fetching Gemini Key:', err);
        return null;
    }
};

// Initialize Gemini client (will be re-initialized per request with user's key if needed)
// function to get client
const getClient = (apiKey: string) => new GoogleGenerativeAI(apiKey);

export const generateContentGemini = async (
    systemPrompt: string,
    userPrompt: string,
    modelName: string = 'gemini-2.0-flash',
    apiKey?: string
): Promise<string | null> => {
    const key = apiKey || await getGeminiKey();
    if (!key) {
        console.error('Missing Gemini API Key');
        throw new Error('Missing Gemini API Key in Environment or Supabase ai_config.');
    }

    try {
        const genAI = getClient(key);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating content with Gemini:', error);
        throw error;
    }
};
