import { describe, it, expect } from 'vitest';
import { normalizeProps } from '../../../utils/normalization';
import { resolveImageUrl } from '../../../utils/url';

describe('OG Normalization Logic', () => {
    const BASE_URL = 'http://localhost:3000';

    describe('resolveImageUrl', () => {
        it('should resolve relative URLs', () => {
            expect(resolveImageUrl('/foo.png', BASE_URL)).toBe('http://localhost:3000/foo.png');
        });

        it('should pass through absolute URLs', () => {
            expect(resolveImageUrl('https://example.com/foo.png', BASE_URL)).toBe('https://example.com/foo.png');
        });

        it('should handle empty inputs', () => {
            expect(resolveImageUrl('', BASE_URL)).toBe('');
        });
    });

    describe('normalizeProps', () => {
        it('should enforce flex display on divs', () => {
            const props = normalizeProps('div', {}, BASE_URL);
            expect(props.style.display).toBe('flex');
        });

        it('should preserve existing display on divs', () => {
            const props = normalizeProps('div', { style: { display: 'grid' } }, BASE_URL);
            expect(props.style.display).toBe('grid');
        });

        it('should resolve backgroundImage urls', () => {
            const props = normalizeProps('div', {
                style: { backgroundImage: "url('/img/bg.png')" }
            }, BASE_URL);
            expect(props.style.backgroundImage).toBe("url('http://localhost:3000/img/bg.png')");
        });

        it('should resolve background shorthand urls', () => {
            const props = normalizeProps('div', {
                style: { background: "no-repeat center/cover url('/img/bg.png')" }
            }, BASE_URL);
            expect(props.style.background).toBe("no-repeat center/cover url('http://localhost:3000/img/bg.png')");
        });

        it('should resolve img src', () => {
            const props = normalizeProps('img', { src: '/avatar.png' }, BASE_URL);
            expect(props.src).toBe('http://localhost:3000/avatar.png');
        });

        it('should provide default placeholder for empty img src', () => {
            const props = normalizeProps('img', {}, BASE_URL);
            expect(props.src).toContain('data:image/gif;base64');
        });

        it('should handle nested style objects gracefully', () => {
            const props = normalizeProps('div', { style: { color: 'red' } }, BASE_URL);
            expect(props.style.display).toBe('flex');
            expect(props.style.color).toBe('red');
        });
    });
});
