import { cleanTitle } from '../src/utils/index';

describe('cleanTitle', () => {
    it('cleans title correctly', () => {
        expect(cleanTitle('  abc   def  ')).toBe('abc def');
        expect(cleanTitle(undefined)).toBe('');
    });
});
