import { scoreContent, saveQAHistory, QAPayload, QAResult } from './content-qa';

export interface PublishGateCheck {
  name: string;
  passed: boolean;
  value?: string | number;
  required?: string | number;
}

export interface PublishGateResult {
  allowed: boolean;
  minScore: number;
  score: number;
  checks: PublishGateCheck[];
  failReasons: string[];
  qa: QAResult;
}

/**
 * Extract AIO elements from HTML content
 */
function analyzeAioElements(html: string): {
  hasQuickAnswer: boolean;
  hasKeyTakeaways: boolean;
  hasSpeakable: boolean;
  questionH2Count: number;
  totalH2Count: number;
} {
  return {
    hasQuickAnswer: /<div[^>]*class="[^"]*quick-answer[^"]*"/i.test(html),
    hasKeyTakeaways: /<div[^>]*class="[^"]*key-takeaways[^"]*"/i.test(html),
    hasSpeakable: /data-speakable/i.test(html),
    questionH2Count: (html.match(/<h2[^>]*>[^<]*\?<\/h2>/gi) || []).length,
    totalH2Count: (html.match(/<h2\b/gi) || []).length,
  };
}

/**
 * Enhanced publish gate with multi-check validation.
 * Validates quality score, meta tags, word count, AIO elements, and featured image.
 */
export async function enforcePublishGate(
  payload: QAPayload & {
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string | null;
    content: string;
  },
  minScore = 70
): Promise<PublishGateResult> {
  const qa = scoreContent(payload);
  await saveQAHistory(payload, qa, 'publish_check');

  const checks: PublishGateCheck[] = [];
  const failReasons: string[] = [];

  // 1. Overall quality score
  const scoreCheck = qa.overall >= minScore;
  checks.push({
    name: 'Quality Score',
    passed: scoreCheck,
    value: qa.overall,
    required: minScore,
  });
  if (!scoreCheck) failReasons.push(`Quality score ${qa.overall} below minimum ${minScore}`);

  // 2. Featured image
  const hasImage = Boolean(payload.featuredImage);
  checks.push({ name: 'Featured Image', passed: hasImage });
  if (!hasImage) failReasons.push('Missing featured image');

  // 3. Meta title
  const metaTitle = (payload.metaTitle || '').trim();
  const metaTitleValid = metaTitle.length >= 35 && metaTitle.length <= 65;
  checks.push({
    name: 'Meta Title',
    passed: metaTitleValid,
    value: metaTitle.length,
    required: '35-65 chars',
  });
  if (!metaTitleValid) failReasons.push(`Meta title length ${metaTitle.length} outside 35-65 chars`);

  // 4. Meta description
  const metaDesc = (payload.metaDescription || '').trim();
  const metaDescValid = metaDesc.length >= 80 && metaDesc.length <= 170;
  checks.push({
    name: 'Meta Description',
    passed: metaDescValid,
    value: metaDesc.length,
    required: '80-170 chars',
  });
  if (!metaDescValid) failReasons.push(`Meta description length ${metaDesc.length} outside 80-170 chars`);

  // 5. Word count
  const wordCount = payload.content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
  const wordCountOk = wordCount >= 800;
  checks.push({
    name: 'Word Count',
    passed: wordCountOk,
    value: wordCount,
    required: 800,
  });
  if (!wordCountOk) failReasons.push(`Word count ${wordCount} below minimum 800`);

  // 6. AIO elements
  const aio = analyzeAioElements(payload.content);

  checks.push({ name: 'Quick Answer Block', passed: aio.hasQuickAnswer });
  if (!aio.hasQuickAnswer) failReasons.push('Missing Quick Answer block for AIO');

  checks.push({ name: 'Key Takeaways Box', passed: aio.hasKeyTakeaways });
  if (!aio.hasKeyTakeaways) failReasons.push('Missing Key Takeaways box for AIO');

  checks.push({
    name: 'Question-based H2s',
    passed: aio.totalH2Count > 0 && aio.questionH2Count / aio.totalH2Count >= 0.5,
    value: `${aio.questionH2Count}/${aio.totalH2Count}`,
    required: '≥50%',
  });

  // Determine pass/fail
  // Required: quality score + meta title + meta description + word count
  // Recommended (warning only): AIO elements, featured image
  const criticalPassed = scoreCheck && metaTitleValid && metaDescValid && wordCountOk;

  return {
    allowed: criticalPassed,
    minScore,
    score: qa.overall,
    checks,
    failReasons,
    qa,
  };
}
