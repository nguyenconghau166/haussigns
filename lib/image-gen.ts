import { generateImage } from './openai'; // Use the wrapper function
import { supabaseAdmin } from './supabase';
import { uploadImageFromUrl } from './storage-upload';

// Định nghĩa kiểu dữ liệu cho kết quả tạo ảnh
interface ImageGenResult {
  success: boolean;
  url?: string;
  error?: string;
}

type ImageContentType = 'page' | 'post' | 'product' | 'project' | 'material' | 'industry' | 'generic';

interface GenerateProjectImageOptions {
  contentType?: ImageContentType;
  keyword?: string;
  preferLibrary?: boolean;
  realismThreshold?: number;
  enableRealismRetry?: boolean;
}

const REALISM_THRESHOLD_DEFAULT = 82;

function isValidGoogleKey(key: string | undefined | null): key is string {
  if (!key) return false;
  if (key.length < 10) return false;
  if (key.startsWith('YOUR_') || key.startsWith('your-') || key.startsWith('your_') || key === 'placeholder') return false;
  return true;
}

async function getGoogleApiKey(): Promise<string | null> {
  const geminiKey = await getConfig('GEMINI_API_KEY');
  const googleKey = await getConfig('google_api_key');
  if (isValidGoogleKey(geminiKey)) return geminiKey;
  if (isValidGoogleKey(googleKey)) return googleKey;
  return null;
}

function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[%_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function firstImageFromArray(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  for (const item of values) {
    if (typeof item === 'string' && item.startsWith('http')) {
      return item;
    }
  }
  return null;
}

function pickImageUrl(...candidates: Array<unknown>): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('http')) {
      return candidate;
    }
    const fromArray = firstImageFromArray(candidate);
    if (fromArray) return fromArray;
  }
  return null;
}

function getContentTypeHint(contentType: ImageContentType): string {
  const hints: Record<ImageContentType, string> = {
    page: 'hero editorial photo of a real signage storefront in Metro Manila, wide-angle with dramatic natural light, street-level perspective',
    post: 'documentary-style photo from inside a real signage fabrication workshop or on-site installation in the Philippines, showing workers and real tools',
    product: 'close-up product shot of real signage materials on a workshop table — visible grain, edge finish, mounting brackets, ruler for scale',
    project: 'wide establishing shot of completed signage installation at a real Filipino business, showing building facade and street context',
    material: 'macro detail shot of signage material cross-section — acrylic edge, stainless steel brushed surface, or LED module wiring, with workshop background',
    industry: 'environmental portrait of a real Filipino business with their installed signage visible, customers or staff present, natural daytime lighting',
    generic: 'candid documentary photo of a signage workshop in Valenzuela City, Philippines, with fabrication equipment and materials visible'
  };
  return hints[contentType] || hints.generic;
}

function enhancePhotorealPrompt(prompt: string): string {
  const base = (prompt || '').trim();
  return [
    'Editorial documentary photograph of a real commercial signage business in Metro Manila, Philippines',
    base || 'real signage installation on a storefront in Makati City',
    'shot on Canon EOS R5 with 35mm f/1.8 lens, natural perspective, shallow depth of field',
    'available natural light with ambient fill, realistic color temperature',
    'visible real-world details: screw heads, silicone edges, wall texture, slight dust, cable conduits',
    'authentic Filipino urban environment: concrete buildings, narrow streets, tropical vegetation, jeepneys in background',
    'photojournalism style, candid business documentation',
    'NO illustration, NO CGI, NO 3D render, NO watermark'
  ].join(', ');
}

async function findReferenceImageFromLibrary(keyword: string, contentType: ImageContentType): Promise<string | null> {
  const term = normalizeSearchTerm(keyword);
  if (!term) return null;

  const orderedTables: Array<ImageContentType> = (() => {
    if (contentType === 'industry') return ['industry', 'project', 'material', 'product'];
    if (contentType === 'material') return ['material', 'product', 'project', 'industry'];
    if (contentType === 'product') return ['product', 'project', 'material', 'industry'];
    if (contentType === 'project') return ['project', 'industry', 'product', 'material'];
    return ['project', 'product', 'industry', 'material'];
  })();

  for (const tableType of orderedTables) {
    try {
      if (tableType === 'project') {
        const { data } = await supabaseAdmin
          .from('projects')
          .select('cover_image, featured_image, gallery_images, title, slug')
          .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
          .limit(8);

        for (const row of data || []) {
          const imageUrl = pickImageUrl(row.cover_image, row.featured_image, row.gallery_images);
          if (imageUrl) return imageUrl;
        }
      }

      if (tableType === 'product') {
        const { data } = await supabaseAdmin
          .from('products')
          .select('cover_image, gallery_images, name, slug')
          .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
          .limit(8);

        for (const row of data || []) {
          const imageUrl = pickImageUrl(row.cover_image, row.gallery_images);
          if (imageUrl) return imageUrl;
        }
      }

      if (tableType === 'industry') {
        const { data } = await supabaseAdmin
          .from('industries')
          .select('image, title, slug')
          .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
          .limit(8);

        for (const row of data || []) {
          const imageUrl = pickImageUrl(row.image);
          if (imageUrl) return imageUrl;
        }
      }

      if (tableType === 'material') {
        const { data } = await supabaseAdmin
          .from('materials')
          .select('image, name, slug')
          .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
          .limit(8);

        for (const row of data || []) {
          const imageUrl = pickImageUrl(row.image);
          if (imageUrl) return imageUrl;
        }
      }
    } catch (error) {
      console.warn(`Reference image lookup failed for ${tableType}:`, error);
    }
  }

  return null;
}

async function toInlineImagePart(imageUrl: string): Promise<{ mimeType: string; data: string } | null> {
  if (!imageUrl) return null;

  const dataUriMatch = imageUrl.match(/^data:(.+?);base64,(.+)$/);
  if (dataUriMatch) {
    return { mimeType: dataUriMatch[1] || 'image/png', data: dataUriMatch[2] };
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { mimeType, data: buffer.toString('base64') };
  } catch {
    return null;
  }
}

async function scoreImageRealism(imageUrl: string, sceneHint: string): Promise<number | null> {
  try {
    const apiKey = await getGoogleApiKey();
    if (!apiKey) return null;

    const inlineImage = await toInlineImagePart(imageUrl);
    if (!inlineImage) return null;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: [
                'Rate how realistic this image is as a real business signage photo.',
                'Return JSON only: {"score": number, "note": "short reason"}.',
                'Score must be 0-100 where 100 is indistinguishable from real photography.',
                `Scene context: ${sceneHint}`
              ].join(' ')
            },
            {
              inlineData: inlineImage
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part.text === 'string')?.text || '';
    if (!text) return null;

    const parsed = JSON.parse(text) as { score?: unknown };
    const score = Number(parsed?.score);
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch {
    return null;
  }
}

// Hàm lấy cấu hình từ Database
async function getConfig(key: string, defaultValue: string = '') {
  // Try env first
  if (process.env[key]) return process.env[key];
  if (key === 'GEMINI_API_KEY' && process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || defaultValue;
}

// Helper: Tự động tìm chuỗi ảnh trong JSON bất kỳ (Smart Response Parser)
// Supports: Google Imagen, Stability AI, Banana.dev, OpenAI, etc.
function extractImageFromResponse(data: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (!d) return null;

  // Case 0: Direct URL string
  if (typeof d === 'string' && d.startsWith('http')) return d;

  // Case 1: Google Imagen (Vertex AI / Gemini API)
  // Format: { predictions: [ { bytesBase64Encoded: "..." } ] }
  if (d.predictions?.[0]?.bytesBase64Encoded) {
    return `data:image/png;base64,${d.predictions[0].bytesBase64Encoded}`;
  }
  if (d.predictions?.[0]?.mimeType && d.predictions?.[0]?.bytesBase64Encoded) {
    return `data:${d.predictions[0].mimeType};base64,${d.predictions[0].bytesBase64Encoded}`;
  }

  // Case 2: Banana.dev / Custom APIs
  if (d.modelOutputs?.[0]?.image_base64) return `data:image/png;base64,${d.modelOutputs[0].image_base64}`;
  if (d.modelOutputs?.[0]?.url) return d.modelOutputs[0].url;

  // Case 3: Stable Diffusion WebUI (Automatic1111) / Replicate
  if (d.images?.[0]) {
    const img = d.images[0];
    return img.startsWith('http') ? img : `data:image/png;base64,${img}`;
  }

  // Case 4: Generic Array
  if (Array.isArray(d) && d[0]?.startsWith?.('http')) return d[0];

  // Case 5: Generic Object with output/url/image/base64
  if (d.output) {
    if (typeof d.output === 'string') {
      return d.output.startsWith('http') ? d.output : `data:image/png;base64,${d.output}`;
    }
    if (Array.isArray(d.output) && d.output[0]) {
      const img = d.output[0];
      return img.startsWith('http') ? img : `data:image/png;base64,${img}`;
    }
    if (d.output.url) return d.output.url;
    if (d.output.image) return d.output.image;
  }

  if (d.url) return d.url;
  if (d.image) return d.image;
  if (d.base64) return `data:image/png;base64,${d.base64}`;

  // Case 6: Artifacts (Stability AI style)
  if (d.artifacts?.[0]?.base64) return `data:image/png;base64,${d.artifacts[0].base64}`;

  return null;
}

// --- ENGINE 1: OPENAI DALL-E 3 ---
async function generateWithDallE(prompt: string): Promise<ImageGenResult> {
  try {
    const url = await generateImage(prompt);
    return { success: !!url, url: url || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('DALL-E Error:', error);
    return { success: false, error: message };
  }
}

// --- ENGINE 2: CUSTOM ENDPOINT (Generic / Banana.dev) ---
async function generateWithCustomEndpoint(prompt: string, endpoint: string, apiKey?: string): Promise<ImageGenResult> {
  try {
    const modelKey = await getConfig('banana_model_key');
    console.log('Calling Custom AI Endpoint:', endpoint);

    const payload = {
      apiKey: apiKey,
      modelKey: modelKey,
      prompt: prompt,
      input: {
        prompt: prompt,
        negative_prompt: "text, watermark, low quality, blurry, distorted, cgi, 3d render, illustration, cartoon, anime, oversaturated, plastic texture",
        width: 1024, height: 768
      },
      modelInputs: { prompt: prompt }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    const imageUrl = extractImageFromResponse(data);

    if (!imageUrl) {
      return { success: false, error: 'Could not detect image in API response.' };
    }

    return { success: true, url: imageUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // console.error('Custom AI Error:', error);
    return { success: false, error: message };
  }
}

// --- ENGINE 3: GOOGLE GEMINI NATIVE IMAGE GENERATION ---
async function generateWithGeminiNative(prompt: string): Promise<ImageGenResult> {
  try {
    // 1. Try to get Google API Key — prioritize GEMINI_API_KEY (usually the real one)
    const apiKey = await getGoogleApiKey();

    // If no valid Google Key, check for legacy Banana/Custom config
    if (!apiKey) {
      const bananaKey = await getConfig('banana_api_key');
      const bananaEndpoint = await getConfig('banana_endpoint');
      if (bananaEndpoint) {
        console.log('Falling back to custom Banana Endpoint due to missing Google Key');
        return generateWithCustomEndpoint(prompt, bananaEndpoint, bananaKey);
      }
      return { success: false, error: 'Missing valid Google/Gemini API Key in configuration.' };
    }

    console.log(`Calling Gemini Native Image Generation (key: ${apiKey.substring(0, 8)}...)...`);

    // Use Gemini 2.0 Flash (image generation capable) or Imagen 3
    const model = 'gemini-2.0-flash-exp';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: `Generate one photorealistic editorial photograph. This must look like a real photo taken by a professional photographer on location at a signage business in the Philippines. Show realistic imperfections: dust, fingerprints on acrylic, uneven silicone lines, visible mounting hardware. Scene: ${prompt}` }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.error?.message || errText);
      } catch {
        throw new Error(`Google API Error ${response.status}: ${errText.substring(0, 200)}`);
      }
    }

    const data = await response.json();

    // Extract image from Gemini generateContent response
    // Response format: { candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }, { text }] } }] }
    const parts = data?.candidates?.[0]?.content?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return { success: true, url: `data:${mimeType};base64,${part.inlineData.data}` };
        }
      }
    }

    // Fallback: try old-style extraction
    const imageUrl = extractImageFromResponse(data);
    if (imageUrl) {
      return { success: true, url: imageUrl };
    }

    console.error('No image found in Gemini response:', JSON.stringify(data).substring(0, 500));
    return { success: false, error: 'Could not detect image in Gemini API response.' };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini Image Gen Error:', error);
    return { success: false, error: message };
  }
}

// --- MAIN ROUTER ---
export async function generateProjectImage(prompt: string, options: GenerateProjectImageOptions = {}): Promise<string | null> {
  const contentType = options.contentType || 'generic';
  const realismThreshold = options.realismThreshold ?? REALISM_THRESHOLD_DEFAULT;
  const shouldUseLibrary = options.preferLibrary !== false;
  const shouldRetryForRealism = options.enableRealismRetry !== false;
  const keyword = options.keyword?.trim() || '';
  const promptWithTypeHint = `${getContentTypeHint(contentType)}, ${prompt}`;
  const enhancedPrompt = enhancePhotorealPrompt(promptWithTypeHint);

  if (shouldUseLibrary && keyword) {
    const referenceImage = await findReferenceImageFromLibrary(keyword, contentType);
    if (referenceImage) {
      console.log(`Using reference image from library for keyword: ${keyword}`);
      return referenceImage;
    }
  }

  // Read provider preference: 'nanobanana' | 'google' | 'banana' | 'dalle'
  let provider = (await getConfig('image_provider')).toLowerCase();

  const hasGeminiKey = Boolean(await getGoogleApiKey());
  const hasBanana = Boolean(await getConfig('banana_endpoint'));
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY) || Boolean(await getConfig('openai_api_key'));

  // Auto-detect primary provider if not set
  if (!provider) {
    if (hasGeminiKey || hasBanana) provider = 'nanobanana';
    else provider = 'dalle';
  }

  const runProvider = async (name: string, promptText: string): Promise<ImageGenResult> => {
    if (name === 'nanobanana' || name === 'google' || name === 'banana') {
      return generateWithGeminiNative(promptText);
    }
    return generateWithDallE(promptText);
  };

  const fallbackCandidates = [provider, hasGeminiKey || hasBanana ? 'nanobanana' : '', hasOpenAI ? 'dalle' : ''];
  const providerOrder = Array.from(new Set(fallbackCandidates.filter(Boolean)));

  const generateAndUpload = async (promptText: string): Promise<string | null> => {
    let result: ImageGenResult = { success: false, error: 'No provider executed' };

    for (const providerName of providerOrder) {
      console.log(`Generating image using provider: ${providerName}`);
      result = await runProvider(providerName, promptText);
      if (result.success && result.url) break;
      console.warn(`Image provider failed (${providerName}): ${result.error || 'Unknown error'}`);
    }

    if (!result.success || !result.url) {
      console.error('Image Generation Failed:', result.error);
      return null;
    }

    try {
      console.log('Uploading generated image to Supabase Storage...');
      const supabaseUrl = await uploadImageFromUrl(result.url);
      if (supabaseUrl) {
        console.log('Image uploaded successfully:', supabaseUrl);
        return supabaseUrl;
      }
      console.error('Failed to upload image to Supabase, falling back to original URL');
      return result.url;
    } catch (uploadError) {
      console.error('Error during image upload:', uploadError);
      return result.url;
    }
  };

  const firstUrl = await generateAndUpload(enhancedPrompt);
  if (!firstUrl) return null;
  if (!shouldRetryForRealism) return firstUrl;

  const firstScore = await scoreImageRealism(firstUrl, promptWithTypeHint);
  if (firstScore === null) return firstUrl;
  if (firstScore >= realismThreshold) {
    console.log(`Realism check passed: ${firstScore}`);
    return firstUrl;
  }

  const stricterPrompt = `${enhancedPrompt}, documentary photojournalism style, realistic installation imperfections, accurate scale and perspective, avoid stylization`;
  const retryUrl = await generateAndUpload(stricterPrompt);
  if (!retryUrl) return firstUrl;

  const retryScore = await scoreImageRealism(retryUrl, promptWithTypeHint);
  if (retryScore !== null && retryScore > firstScore) {
    console.log(`Realism retry improved score: ${firstScore} -> ${retryScore}`);
    return retryUrl;
  }

  return firstUrl;
}
