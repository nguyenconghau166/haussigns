/**
 * Extract FAQ-like Q&A pairs from HTML content and generate FAQPage schema.
 * Looks for headings ending with "?" or sections titled "FAQ" / "Frequently Asked".
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export function extractFaqFromContent(html: string): FaqItem[] {
  if (!html) return [];

  const faqs: FaqItem[] = [];

  // Pattern 1: H2/H3 headings that end with "?"
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const matches = [...html.matchAll(headingRegex)];

  for (let i = 0; i < matches.length; i++) {
    const headingText = matches[i][1].replace(/<[^>]*>/g, '').trim();
    if (!headingText.endsWith('?')) continue;

    // Get content between this heading and next heading
    const startIdx = matches[i].index! + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    const answerHtml = html.slice(startIdx, endIdx);

    // Extract text from first paragraph(s)
    const paragraphs = [...answerHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const answerText = paragraphs
      .slice(0, 2)
      .map((m) => m[1].replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join(' ');

    if (answerText.length > 20) {
      faqs.push({ question: headingText, answer: answerText });
    }
  }

  // Pattern 2: <dt>/<dd> definition lists (FAQ format)
  const dtRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const match of html.matchAll(dtRegex)) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').trim();
    if (question && answer.length > 20) {
      faqs.push({ question, answer });
    }
  }

  return faqs.slice(0, 10);
}

export function buildFaqSchema(faqs: FaqItem[]): object | null {
  if (!faqs.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate FAQ items from pros/cons arrays (for material pages)
 */
export function generateFaqFromProsConsBestFor(
  name: string,
  pros: string[],
  cons: string[],
  bestFor: string
): FaqItem[] {
  const faqs: FaqItem[] = [];

  if (pros?.length > 0) {
    faqs.push({
      question: `What are the advantages of ${name} for signage?`,
      answer: pros.join('. ') + '.',
    });
  }

  if (cons?.length > 0) {
    faqs.push({
      question: `What are the considerations when using ${name}?`,
      answer: cons.join('. ') + '.',
    });
  }

  if (bestFor) {
    faqs.push({
      question: `What is ${name} best used for in signage?`,
      answer: bestFor,
    });
  }

  return faqs;
}
