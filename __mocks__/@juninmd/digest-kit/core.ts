export function extractArticleFromHtml(html: string, options: Record<string, unknown> = {}) {
  if (!html || typeof html !== 'string') return null;

  const markdown = html
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!markdown) return null;

  return {
    title: null,
    byline: null,
    excerpt: markdown.replace(/[*_#`~>]/g, '').trim(),
    siteName: null,
    publishedTime: null,
    contentMarkdown: markdown,
    charCount: markdown.length,
  };
}
