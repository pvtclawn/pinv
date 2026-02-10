import { NextResponse } from 'next/server';
import { withAxiom, AxiomRequest } from 'next-axiom';
import { createVerifyAppKeyWithHub, parseWebhookEvent } from '@farcaster/miniapp-node';

export const POST = withAxiom(async (req: AxiomRequest) => {
    try {
        const body = await req.json();

        // Use standard Farcaster public Hub (free) for verification
        const HUB_URL = 'https://nemes.farcaster.xyz:2281';
        const verifyAppKey = createVerifyAppKeyWithHub(HUB_URL);

        let validatedData;
        try {
            validatedData = await parseWebhookEvent(body, verifyAppKey);
        } catch (err) {
            console.error('[MiniApp Webhook] Verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature or app key' }, { status: 401 });
        }

        const { fid, event } = validatedData;
        const eventType = event.event;
        const timestamp = Date.now();
        const eventId = `pinv:webhook:${fid}:${timestamp}`;

        req.log.info('MiniApp Webhook Verified', {
            eventId,
            fid,
            eventType,
            event
        });

        // Handle specific events
        if (eventType === 'miniapp_added') {
            const { notificationDetails } = event;
            if (notificationDetails) {
                console.log(`[MiniApp Webhook] User ${fid} added app. Notification Token: ${notificationDetails.token.slice(0, 8)}...`);
                // TODO: Store notificationDetails.token and notificationDetails.url in KV indexed by FID
                // await kv.hset(`user:${fid}`, { 
                //    notificationToken: notificationDetails.token, 
                //    notificationUrl: notificationDetails.url 
                // });
            }
        } else if (eventType === 'miniapp_removed') {
            console.log(`[MiniApp Webhook] User ${fid} removed app.`);
            // TODO: Remove notification info from KV
            // await kv.hdel(`user:${fid}`, 'notificationToken', 'notificationUrl');
        }

        console.log(`[MiniApp Webhook] Processed verified event ${eventType} for FID ${fid}`);
        return NextResponse.json({ success: true, message: 'Event processed' });
    } catch (error) {
        console.error('[MiniApp Webhook] Error processing request:', error);
        req.log.error('MiniApp Webhook Server Error', { error: String(error) });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
});
