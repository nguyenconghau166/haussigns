import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../supabase';

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

const MODEL_ALIASES: Record<string, string> = {
  'gemini-1.5-flash': 'gemini-2.0-flash',
  'gemini-1.5-pro': 'gemini-2.0-flash',
  'gemini-3-flash': 'gemini-2.0-flash',
  'gemini-3-pro': 'gemini-2.0-flash',
};

const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

function normalizeModelName(input?: string | null): string {
  if (!input) return DEFAULT_GEMINI_MODEL;
  const clean = input.replace(/^models\//i, '').trim().toLowerCase();
  return MODEL_ALIASES[clean] || clean;
}

function isModelNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('404') ||
    message.includes('not found for API version') ||
    message.includes('not supported for generateContent')
  );
}

// Helper to fetch Gemini Key and Model from DB
export const getGeminiConfig = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', ['GEMINI_API_KEY', 'GEMINI_MODEL']);

    if (error) {
      console.warn('Failed to fetch Gemini config from Supabase:', error);
      return { apiKey: process.env.GEMINI_API_KEY || null, model: DEFAULT_GEMINI_MODEL };
    }

    const configMap = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      apiKey: process.env.GEMINI_API_KEY || configMap['GEMINI_API_KEY'],
      model: configMap['GEMINI_MODEL'] || DEFAULT_GEMINI_MODEL
    };
  } catch (err) {
    console.error('Error fetching Gemini Config:', err);
    return { apiKey: process.env.GEMINI_API_KEY || null, model: DEFAULT_GEMINI_MODEL };
  }
};

const getClient = (apiKey: string) => new GoogleGenerativeAI(apiKey);

export const generateContentGemini = async (
  systemPrompt: string,
  userPrompt: string,
  modelName?: string,
  apiKey?: string,
  options?: { temperature?: number; topK?: number; topP?: number }
): Promise<string | null> => {
  const config = await getGeminiConfig();
  const key = apiKey || config.apiKey;
  const configuredModel = normalizeModelName(modelName || config.model || DEFAULT_GEMINI_MODEL);

  if (!key) {
    console.error('Missing Gemini API Key');
    throw new Error('Missing Gemini API Key in Environment or Supabase ai_config.');
  }

  const runWithModel = async (activeModel: string): Promise<string | null> => {
    const genAI = getClient(key);
    const model = genAI.getGenerativeModel({
      model: activeModel,
      generationConfig: options
    });

    const prompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  };

  try {
    return await runWithModel(configuredModel);
  } catch (error) {
    if (!isModelNotFoundError(error)) {
      console.error('Error generating content with Gemini:', error);
      throw error;
    }

    const fallbackQueue = FALLBACK_MODELS
      .map((model) => normalizeModelName(model))
      .filter((model, index, arr) => model !== configuredModel && arr.indexOf(model) === index);

    for (const fallbackModel of fallbackQueue) {
      try {
        console.warn(`Gemini model fallback: ${configuredModel} -> ${fallbackModel}`);
        return await runWithModel(fallbackModel);
      } catch (fallbackError) {
        if (!isModelNotFoundError(fallbackError)) {
          console.error('Error generating content with Gemini fallback model:', fallbackError);
          throw fallbackError;
        }
      }
    }

    console.error('Error generating content with Gemini:', error);
    throw new Error(`Gemini model unavailable: ${configuredModel}. Please update GEMINI_MODEL in settings.`);
  }
};
