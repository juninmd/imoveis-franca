import { cleanTitle, extractDescriptionFromHtml, _setExtractorForTest } from '../src/utils/index';

describe('cleanTitle', () => {
    it('cleans title correctly', () => {
        expect(cleanTitle('  abc   def  ')).toBe('abc def');
        expect(cleanTitle(undefined)).toBe('');
    });
});

describe('extractDescriptionFromHtml', () => {
    afterEach(() => {
        _setExtractorForTest(null);
    });

    it('handles empty and whitespace input', () => {
        expect(extractDescriptionFromHtml('')).toBe('');
        expect(extractDescriptionFromHtml('   ')).toBe('');
        expect(extractDescriptionFromHtml(undefined)).toBe('');
    });

    it('extracts and cleans html with markdown and link stripping', () => {
        const html = '<p>Casa com <b>3 quartos</b> e <a href="https://example.com">piscina</a>.</p>';
        const out = extractDescriptionFromHtml(html);
        expect(out).toBe('Casa com 3 quartos e piscina.');
    });

    it('falls back to regex strip when extractArticle returns null', () => {
        _setExtractorForTest(() => null);
        expect(extractDescriptionFromHtml('<div><span>Fallback text</span></div>')).toBe('Fallback text');
    });

    it('falls back to regex strip when extractor throws an error', () => {
        _setExtractorForTest(() => {
            throw new Error('extractor failure');
        });
        expect(extractDescriptionFromHtml('<div><span>Error text</span></div>')).toBe('Error text');
    });
});
