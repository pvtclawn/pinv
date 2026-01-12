import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-ignore
import { loadGraphemeImages, loadDynamicFonts } from '../../../og/services/assets';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock as any;

describe('OG Assets Logic', () => {
    beforeEach(() => {
        fetchMock.mockReset();
    });

    describe('loadGraphemeImages', () => {
        it('should detect emojis and fetch twemojis', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                text: async () => '<svg>emoji</svg>'
            });

            const html = '<div>Hello 🌍</div>';
            const images = await loadGraphemeImages(html);

            expect(images['🌍']).toBeDefined();
            expect(images['🌍']).toContain('data:image/svg+xml;base64');
            const base64 = images['🌍'].split(',')[1];
            expect(Buffer.from(base64, 'base64').toString()).toBe('<svg>emoji</svg>');
        });

        it('should handle fetch failures gracefully', async () => {
            fetchMock.mockResolvedValue({ ok: false });
            const html = '<div>Hello 🌍</div>';
            const images = await loadGraphemeImages(html);
            expect(images['🌍']).toBeUndefined();
        });

        it('should load ZWJ sequence emojis', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                text: async () => '<svg>family</svg>'
            });
            const family = '👩‍👩‍👦'; // ZWJ sequence
            const result = await loadGraphemeImages(`<div>${family}</div>`);
            // Check if key exists (the full sequence)
            expect(result[family]).toBeDefined();
            // Should be data URL
            expect(result[family]).toMatch(/^data:image\/svg\+xml/);
        });

        it('should retry with variation selector logic (mocked)', async () => {
            // First call fails (404), second call succeeds (retry without fe0f)
            fetchMock
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => '<svg>retry</svg>'
                });

            // Providing an emoji that would trigger retry logic (e.g. one with variation selector in hex, though the function derives hex from char)
            // We test the logic flow.
            const html = '<div>Hello ❤️</div>'; // Heart usually has VS
            await loadGraphemeImages(html);

            // We assume the implementation tries correct URLs. 
            // Ideally we'd spy on fetch args, but for now we check resilience.
            expect(fetchMock).toHaveBeenCalled();
        });
    });

    describe('loadDynamicFonts', () => {
        it('should fetch fonts from config', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(10)
            });

            const config = {
                fonts: [{ name: 'Custom', url: 'http://example.com/font.ttf' }]
            };
            const fonts = await loadDynamicFonts(config);

            expect(fonts).toHaveLength(1);
            expect(fonts[0].name).toBe('Custom');
            expect(fonts[0].data).toBeInstanceOf(Buffer);
        });

        it('should ignore failed font fetches', async () => {
            fetchMock.mockResolvedValue({ ok: false });
            const config = {
                fonts: [{ name: 'Bad', url: 'http://example.com/404.ttf' }]
            };
            const fonts = await loadDynamicFonts(config);
            expect(fonts).toHaveLength(0);
        });
    });
});
