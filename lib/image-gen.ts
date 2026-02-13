import { generateImage } from './openai'; // Use the wrapper function
import { supabaseAdmin } from './supabase';
import { uploadImageFromUrl } from './storage-upload';

// Định nghĩa kiểu dữ liệu cho kết quả tạo ảnh
interface ImageGenResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Hàm lấy cấu hình từ Database
async function getConfig(key: string, defaultValue: string = '') {
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
        negative_prompt: "text, watermark, low quality, blurry, distorted",
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

// --- ENGINE 3: NANO BANANA PRO (Mapped to Google Imagen 3) ---
async function generateWithNanoBananaPro(prompt: string): Promise<ImageGenResult> {
  try {
    // 1. Try to get Google API Key
    const apiKey = await getConfig('google_api_key');

    // If no Google Key, check for legacy Banana/Custom config
    if (!apiKey) {
      const bananaKey = await getConfig('banana_api_key');
      const bananaEndpoint = await getConfig('banana_endpoint');
      if (bananaEndpoint) {
        console.log('Falling back to custom Banana Endpoint due to missing Google Key');
        return generateWithCustomEndpoint(prompt, bananaEndpoint, bananaKey);
      }
      return { success: false, error: 'Missing Google API Key (google_api_key) in configuration.' };
    }

    console.log('Calling Google Nano Banana Pro (Imagen 3)...');

    // Use REST API for Imagen 3 via Gemini API
    // Note: The model name could be 'imagen-3.0-generate-001' or similar depending on availability
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const payload = {
      instances: [
        { prompt: prompt }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "4:3",
        personGeneration: "allow_adult"
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // API Key is in query param
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      // Try to parse error
      try {
        const errJson = JSON.parse(errText);
        // If error is 404, maybe model name is different?
        if (response.status === 404) {
          throw new Error('Imagen 3 Model not found. Please ensure you have access to Imagen 3 in Google AI Studio.');
        }
        throw new Error(errJson.error?.message || errText);
      } catch (e) {
        throw new Error(`Google API Error ${response.status}: ${errText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    const imageUrl = extractImageFromResponse(data);

    if (!imageUrl) {
      console.error('Unknown Google JSON structure:', JSON.stringify(data));
      return { success: false, error: 'Could not detect image in Google API response.' };
    }

    return { success: true, url: imageUrl };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Nano Banana Pro Error:', error);
    return { success: false, error: message };
  }
}

// --- MAIN ROUTER ---
export async function generateProjectImage(prompt: string): Promise<string | null> {
  // Read provider preference: 'nanobanana', 'google', 'dalle'
  let provider = await getConfig('image_provider');

  // Auto-detect provider if not set
  if (!provider) {
    const googleKey = await getConfig('google_api_key');
    const bananaKey = await getConfig('banana_api_key');

    if (googleKey) provider = 'nanobanana';
    else if (bananaKey) provider = 'banana';
    else provider = 'dalle';
  }

  console.log(`Generating image using provider: ${provider}`);

  let result: ImageGenResult;

  if (provider === 'nanobanana' || provider === 'google' || provider === 'banana') {
    result = await generateWithNanoBananaPro(prompt);
  } else {
    result = await generateWithDallE(prompt);
  }

  if (result.success && result.url) {
    // START: Upload to Supabase Storage
    try {
      console.log('Uploading generated image to Supabase Storage...');
      const supabaseUrl = await uploadImageFromUrl(result.url);
      if (supabaseUrl) {
        console.log('Image uploaded successfully:', supabaseUrl);
        return supabaseUrl;
      } else {
        console.error('Failed to upload image to Supabase, falling back to original URL');
        return result.url;
      }
    } catch (uploadError) {
      console.error('Error during image upload:', uploadError);
      return result.url;
    }
    // END: Upload to Supabase Storage
  } else {
    console.error('Image Generation Failed:', result.error);
    // Fallback placeholder
    return 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop';
  }
}
