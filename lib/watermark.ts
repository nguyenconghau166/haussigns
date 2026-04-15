import sharp from 'sharp';
import { supabaseAdmin } from './supabase';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

async function getWatermarkConfig(): Promise<{
  enabled: boolean;
  mode: 'text' | 'logo';
  text: string;
  logoPath: string;
  opacity: number;
  position: 'bottom-right' | 'bottom-left' | 'center';
}> {
  try {
    const { data } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', ['watermark_enabled', 'watermark_text', 'watermark_opacity', 'watermark_position', 'watermark_mode', 'watermark_logo_path']);

    const config = (data || []).reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      enabled: config.watermark_enabled === 'true',
      mode: (config.watermark_mode as 'text' | 'logo') || 'text',
      text: config.watermark_text || 'SignsHaus',
      logoPath: config.watermark_logo_path || '/logo-web.png',
      opacity: Math.min(1, Math.max(0.1, parseFloat(config.watermark_opacity || '0.3') || 0.3)),
      position: (config.watermark_position as 'bottom-right' | 'bottom-left' | 'center') || 'bottom-right',
    };
  } catch {
    return { enabled: false, mode: 'text', text: 'SignsHaus', logoPath: '/logo-web.png', opacity: 0.3, position: 'bottom-right' };
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

  const opacity = options?.opacity ?? config.opacity;
  const position = options?.position || config.position;

  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Logo watermark mode
    if (config.mode === 'logo') {
      try {
        let logoBuffer: Buffer;
        if (config.logoPath.startsWith('http')) {
          const response = await fetch(config.logoPath);
          logoBuffer = Buffer.from(await response.arrayBuffer());
        } else {
          const logoFilePath = join(process.cwd(), 'public', config.logoPath);
          logoBuffer = await readFile(logoFilePath);
        }

        // Resize logo to ~15% of image width
        const logoWidth = Math.round(width * 0.15);
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoWidth)
          .ensureAlpha()
          .toBuffer();

        // Apply opacity to the logo
        const alphaValue = Math.round(opacity * 255);
        const logoWithOpacity = await sharp(resizedLogo)
          .composite([{
            input: Buffer.from([255, 255, 255, alphaValue]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'dest-in' as const,
          }])
          .toBuffer();

        const logoMeta = await sharp(logoWithOpacity).metadata();
        const logoHeight = logoMeta.height || logoWidth;
        const padding = Math.round(width * 0.03);

        // Calculate position
        let left: number;
        let top: number;

        switch (position) {
          case 'bottom-left':
            left = padding;
            top = height - logoHeight - padding;
            break;
          case 'center':
            left = Math.round((width - logoWidth) / 2);
            top = Math.round((height - logoHeight) / 2);
            break;
          case 'bottom-right':
          default:
            left = width - logoWidth - padding;
            top = height - logoHeight - padding;
            break;
        }

        return await sharp(imageBuffer)
          .composite([{ input: logoWithOpacity, top, left }])
          .toBuffer();
      } catch (logoError) {
        console.error('Logo watermark failed, falling back to text:', logoError);
        // Fall through to text watermark
      }
    }

    // Text watermark mode (default / fallback)
    const text = options?.text || config.text;
    const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.04));
    const padding = Math.round(fontSize * 1.5);

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
