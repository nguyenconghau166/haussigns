import { generateImage } from './openai'; // Use the wrapper function
import { supabaseAdmin } from './supabase';

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
function extractImageFromResponse(data: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (!d) return null;

  // Case 1: Trả về trực tiếp URL (string)
  if (typeof d === 'string' && d.startsWith('http')) return d;

  // Case 2: Cấu trúc phổ biến của Banana.dev
  if (d.modelOutputs?.[0]?.image_base64) return `data:image/png;base64,${d.modelOutputs[0].image_base64}`;
  if (d.modelOutputs?.[0]?.url) return d.modelOutputs[0].url;

  // Case 3: Cấu trúc Stable Diffusion WebUI (Automatic1111) / Replicate
  if (d.images?.[0]) {
    const img = d.images[0];
    return img.startsWith('http') ? img : `data:image/png;base64,${img}`;
  }

  if (Array.isArray(d) && d[0]?.startsWith?.('http')) return d[0];

  // Case 4: Cấu trúc chung (output: url/base64)
  if (d.output) {
    if (typeof d.output === 'string') {
      // Kiểm tra xem là URL hay Base64
      return d.output.startsWith('http') ? d.output : `data:image/png;base64,${d.output}`;
    }
    if (Array.isArray(d.output) && d.output[0]) {
      const img = d.output[0];
      return img.startsWith('http') ? img : `data:image/png;base64,${img}`;
    }
    if (d.output.url) return d.output.url;
    if (d.output.image) return d.output.image;
  }

  // Case 5: Cấu trúc phẳng
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

// --- ENGINE 2: NANO BANANA PRO (Smart Adapter) ---
async function generateWithBananaPro(prompt: string): Promise<ImageGenResult> {
  try {
    const apiKey = await getConfig('banana_api_key');
    const endpoint = await getConfig('banana_endpoint');
    const modelKey = await getConfig('banana_model_key');

    if (!endpoint) return { success: false, error: 'Missing Endpoint URL' };

    console.log('Calling Custom AI:', endpoint);

    // Xây dựng Request Body đa năng (Universal Payload)
    // Gửi prompt vào nhiều vị trí khác nhau để API nào cũng hiểu
    const payload = {
      apiKey: apiKey,
      modelKey: modelKey,
      prompt: prompt, // Field phổ biến
      input: {
        prompt: prompt,
        negative_prompt: "text, watermark, low quality, blurry, distorted",
        width: 1024, height: 768
      },
      modelInputs: { prompt: prompt } // Banana default
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
      // Cố gắng đọc lỗi từ body
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();

    // Dùng hàm thông minh để trích xuất ảnh
    const imageUrl = extractImageFromResponse(data);

    if (!imageUrl) {
      console.error('Unknown JSON structure:', JSON.stringify(data));
      return { success: false, error: 'Could not detect image in API response.' };
    }

    return { success: true, url: imageUrl };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Custom AI Error:', error);
    return { success: false, error: message };
  }
}

// --- MAIN ROUTER ---
export async function generateProjectImage(prompt: string): Promise<string | null> {
  const provider = await getConfig('image_provider', 'dalle');

  console.log(`Generating image using provider: ${provider}`);

  let result: ImageGenResult;

  if (provider === 'banana') {
    result = await generateWithBananaPro(prompt);
  } else {
    result = await generateWithDallE(prompt);
  }

  if (result.success && result.url) {
    return result.url;
  } else {
    console.error('Image Generation Failed:', result.error);
    return 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop';
  }
}
