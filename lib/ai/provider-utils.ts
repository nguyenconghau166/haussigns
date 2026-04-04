export type AIProvider = 'openai' | 'gemini' | 'anthropic';

/**
 * Infer the AI provider from a model name.
 * - gpt-*, o1-*, o3-*, ft:gpt-* → openai
 * - gemini-* → gemini
 * - claude-* → anthropic
 * Falls back to the given default (or 'gemini') if pattern doesn't match.
 */
export function inferProvider(model: string, fallback: AIProvider = 'gemini'): AIProvider {
  const m = model.trim().toLowerCase();
  if (m.startsWith('gpt-') || m.startsWith('o1-') || m.startsWith('o3-') || m.startsWith('ft:gpt-')) {
    return 'openai';
  }
  if (m.startsWith('gemini-')) {
    return 'gemini';
  }
  if (m.startsWith('claude-')) {
    return 'anthropic';
  }
  return fallback;
}

/** Shared model options for admin UI dropdowns */
export const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: '[OpenAI] GPT-4o Mini' },
  { value: 'gpt-4o', label: '[OpenAI] GPT-4o' },
  { value: 'gpt-5.2', label: '[OpenAI] GPT-5.2' },
  { value: 'gemini-2.0-flash', label: '[Gemini] 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: '[Gemini] 2.0 Flash Lite' },
  { value: 'claude-sonnet-4-20250514', label: '[Claude] Sonnet 4' },
  { value: 'claude-3-5-haiku-20241022', label: '[Claude] 3.5 Haiku (Fast)' },
];
