import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../supabase';

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const FALLBACK_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-haiku-20241022',
];

function isModelNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('404') ||
    message.includes('not_found') ||
    message.includes('does not exist')
  );
}

export const getClaudeConfig = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', ['ANTHROPIC_API_KEY']);

    if (error) {
      console.warn('Failed to fetch Claude config from Supabase:', error);
      return { apiKey: process.env.ANTHROPIC_API_KEY || null };
    }

    const configMap = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      apiKey: process.env.ANTHROPIC_API_KEY || configMap['ANTHROPIC_API_KEY'],
    };
  } catch (err) {
    console.error('Error fetching Claude Config:', err);
    return { apiKey: process.env.ANTHROPIC_API_KEY || null };
  }
};

export const generateContentClaude = async (
  systemPrompt: string,
  userPrompt: string,
  modelName?: string,
  apiKey?: string,
  options?: { temperature?: number; topK?: number; topP?: number }
): Promise<string | null> => {
  const config = await getClaudeConfig();
  const key = apiKey || config.apiKey;
  const configuredModel = modelName || DEFAULT_CLAUDE_MODEL;

  if (!key) {
    console.error('Missing Anthropic API Key');
    throw new Error('Missing Anthropic API Key in Environment or Supabase ai_config.');
  }

  const runWithModel = async (activeModel: string): Promise<string | null> => {
    const client = new Anthropic({ apiKey: key });

    const response = await client.messages.create({
      model: activeModel,
      max_tokens: 4096,
      temperature: options?.temperature ?? 0.7,
      ...(options?.topP !== undefined ? { top_p: options.topP } : {}),
      ...(options?.topK !== undefined ? { top_k: options.topK } : {}),
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : null;
  };

  try {
    return await runWithModel(configuredModel);
  } catch (error) {
    if (!isModelNotFoundError(error)) {
      console.error('Error generating content with Claude:', error);
      throw error;
    }

    const fallbackQueue = FALLBACK_MODELS.filter((m) => m !== configuredModel);

    for (const fallbackModel of fallbackQueue) {
      try {
        console.warn(`Claude model fallback: ${configuredModel} -> ${fallbackModel}`);
        return await runWithModel(fallbackModel);
      } catch (fallbackError) {
        if (!isModelNotFoundError(fallbackError)) {
          console.error('Error generating content with Claude fallback model:', fallbackError);
          throw fallbackError;
        }
      }
    }

    console.error('Error generating content with Claude:', error);
    throw new Error(`Claude model unavailable: ${configuredModel}. Please update model in settings.`);
  }
};
