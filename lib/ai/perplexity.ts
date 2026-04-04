import OpenAI from 'openai';
import { supabaseAdmin } from '../supabase';

const DEFAULT_PERPLEXITY_MODEL = 'sonar-pro';

async function getPerplexityConfig() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', ['PERPLEXITY_API_KEY']);

    if (error) {
      console.warn('Failed to fetch Perplexity config from Supabase:', error);
      return { apiKey: process.env.PERPLEXITY_API_KEY || null };
    }

    const configMap = (data || []).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      apiKey: process.env.PERPLEXITY_API_KEY || configMap['PERPLEXITY_API_KEY'] || null,
    };
  } catch (err) {
    console.error('Error fetching Perplexity config:', err);
    return { apiKey: process.env.PERPLEXITY_API_KEY || null };
  }
}

export async function generateContentPerplexity(
  systemPrompt: string,
  userPrompt: string,
  modelName?: string,
  apiKey?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  const config = await getPerplexityConfig();
  const key = apiKey || config.apiKey;
  const model = modelName || DEFAULT_PERPLEXITY_MODEL;

  if (!key) {
    console.error('Missing Perplexity API Key');
    throw new Error('Missing Perplexity API Key in Environment or Supabase ai_config.');
  }

  const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://api.perplexity.ai',
  });

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating content with Perplexity:', error);
    throw error;
  }
}
