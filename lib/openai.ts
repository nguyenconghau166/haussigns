import OpenAI from 'openai';
import { supabaseAdmin } from './supabase';

// Helper to fetch OpenAI Key
const getOpenAIKey = async () => {
  try {
    // Try to get from Env first (dev override), then Database
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('value')
      .eq('key', 'openai_api_key')
      .single();

    if (error || !data?.value) {
      console.warn('Failed to fetch OpenAI API Key from Supabase:', error);
      return null;
    }

    return data.value;
  } catch (err) {
    console.error('Error fetching OpenAI Key:', err);
    return null;
  }
};

export const generateContent = async (systemPrompt: string, userPrompt: string, model = 'gpt-4') => {
  const apiKey = await getOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API Key not found in Environment or Supabase ai_config.');

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });
    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

export const generateImage = async (prompt: string, size: '1024x1024' = '1024x1024') => {
  const apiKey = await getOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API Key not found in Environment or Supabase ai_config.');

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      quality: 'hd',
      style: 'vivid',
    });
    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

// Export a dummy client for types or legacy usage if needed, but it won't work without key
// Deprecating direct export of 'openai'
export const openai = new OpenAI({ apiKey: 'placeholder' }); 
