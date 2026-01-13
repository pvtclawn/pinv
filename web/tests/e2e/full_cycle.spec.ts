import { test, expect } from '@playwright/test';

test.describe('OG Engine API Generation', () => {
    test('should generate an image from code via Preview API', async ({ request }) => {
        // 1. Generate (Simulate Preview)
        // /og/preview returns JSON { result, logs, image: base64 }
        const response = await request.post('/og/preview', {
            data: {
                uiCode: `export default function Pin() { return <div style={{color:'red'}}>Hello E2E</div> }`,
                params: {}
            }
        });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body = await response.json();

        // 2. Verify Generation Success
        // Expect 'image' to be a Base64 string
        expect(body.image).toBeTruthy();
        expect(typeof body.image).toBe('string');
        expect(body.image.length).toBeGreaterThan(100);

        console.log('Generated Image Base64 Length:', body.image.length);
    });
});
