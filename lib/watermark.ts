import sharp from 'sharp';
import { supabaseAdmin } from './supabase';

interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

async function getWatermarkConfig(): Promise<{
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'bottom-right' | 'bottom-left' | 'center';
}> {
  try {
    const { data } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', ['watermark_enabled', 'watermark_text', 'watermark_opacity', 'watermark_position']);

    const config = (data || []).reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      enabled: config.watermark_enabled === 'true',
      text: config.watermark_text || 'SignsHaus',
      opacity: Math.min(1, Math.max(0.1, parseFloat(config.watermark_opacity || '0.3') || 0.3)),
      position: (config.watermark_position as 'bottom-right' | 'bottom-left' | 'center') || 'bottom-right',
    };
  } catch {
    return { enabled: false, text: 'SignsHaus', opacity: 0.3, position: 'bottom-right' };
  }
}

/**
 * Apply watermark to an image buffer.
 * Reads config from ai_config table unless options override.
 * Returns original buffer if watermark is disabled.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options?: WatermarkOptions
): Promise<Buffer> {
  const config = await getWatermarkConfig();

  if (!config.enabled) return imageBuffer;

  const text = options?.text || config.text;
  const opacity = options?.opacity ?? config.opacity;
  const position = options?.position || config.position;

  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Scale font size relative to image dimensions
    const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.04));
    const padding = Math.round(fontSize * 1.5);

    // Calculate text position
    let x: number;
    let y: number;
    let textAnchor: string;

    switch (position) {
      case 'bottom-left':
        x = padding;
        y = height - padding;
        textAnchor = 'start';
        break;
      case 'center':
        x = Math.round(width / 2);
        y = Math.round(height / 2);
        textAnchor = 'middle';
        break;
      case 'bottom-right':
      default:
        x = width - padding;
        y = height - padding;
        textAnchor = 'end';
        break;
    }

    // Create SVG overlay with watermark text
    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: rgba(255, 255, 255, ${opacity});
            text-anchor: ${textAnchor};
            dominant-baseline: auto;
          }
          .watermark-shadow {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: rgba(0, 0, 0, ${Math.min(opacity * 0.5, 0.3)});
            text-anchor: ${textAnchor};
            dominant-baseline: auto;
          }
        </style>
        <text x="${x + 1}" y="${y + 1}" class="watermark-shadow">${escapeXml(text)}</text>
        <text x="${x}" y="${y}" class="watermark">${escapeXml(text)}</text>
      </svg>
    `);

    const result = await sharp(imageBuffer)
      .composite([{
        input: svgOverlay,
        top: 0,
        left: 0,
      }])
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Error applying watermark:', error);
    // Return original buffer on failure rather than breaking the upload
    return imageBuffer;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
