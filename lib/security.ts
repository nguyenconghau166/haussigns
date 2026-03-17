const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'svg',
  'math',
];

function stripBlockedTags(html: string): string {
  let sanitized = html;

  for (const tag of BLOCKED_TAGS) {
    const pairRe = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClosingRe = new RegExp(`<${tag}\\b[^>]*\\/?\\s*>`, 'gi');
    sanitized = sanitized.replace(pairRe, '');
    sanitized = sanitized.replace(selfClosingRe, '');
  }

  return sanitized;
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = stripBlockedTags(html);

  sanitized = sanitized
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*(expression\s*\(|url\s*\(\s*javascript:)[^"]*"/gi, '')
    .replace(/\sstyle\s*=\s*'[^']*(expression\s*\(|url\s*\(\s*javascript:)[^']*'/gi, '')
    .replace(/\ssrcdoc\s*=\s*"[^"]*"/gi, '')
    .replace(/\ssrcdoc\s*=\s*'[^']*'/gi, '')
    .replace(/\s(href|src|xlink:href)\s*=\s*"\s*(javascript:|vbscript:|data:text\/html)[^"]*"/gi, '')
    .replace(/\s(href|src|xlink:href)\s*=\s*'\s*(javascript:|vbscript:|data:text\/html)[^']*'/gi, '');

  return sanitized;
}

export function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

export function sanitizeTrackingId(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : undefined;
}

export function extractSafeMapEmbedUrl(value?: string): string | null {
  if (!value) return null;

  const raw = value.trim();
  const iframeMatch = raw.match(/<iframe[^>]*\ssrc=(['"])(.*?)\1/i);
  const src = iframeMatch?.[2] || raw;

  try {
    const url = new URL(src);
    const isGoogleHost =
      url.hostname === 'google.com' ||
      url.hostname === 'www.google.com' ||
      url.hostname === 'maps.google.com' ||
      url.hostname.endsWith('.google.com');

    if (url.protocol !== 'https:' || !isGoogleHost) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
