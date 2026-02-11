import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client (will be re-initialized per request with user's key if needed)
// function to get client
const getClient = (apiKey: string) => new GoogleGenerativeAI(apiKey);

export const generateContentGemini = async (
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    modelName: string = 'gemini-3-flash'
): Promise<string | null> => {
    if (!apiKey) {
        console.error('Missing Gemini API Key');
        throw new Error('Missing Gemini API Key');
    }

    try {
        const genAI = getClient(apiKey);
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
