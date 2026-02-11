import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

export const generateContent = async (systemPrompt: string, userPrompt: string, model = 'gpt-5.2') => {
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
