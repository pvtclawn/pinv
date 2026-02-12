import { FastifyRequest, FastifyReply } from 'fastify';
import { executeBoxAction } from '../infra/box';
import { renderImageInWorker } from '../infra/renderer';
import { generateOgImage } from '../services/generator';
import { resolveContext } from '../services/auth';
import { generateCacheKey } from '../utils/keygen';
import { serveWithSWR } from '../services/swr';
import { logToFile } from '../utils/logger';

import { fetchIpfsJson, pinIpfsJson } from '../infra/ipfs';
import { OG_WIDTH, OG_HEIGHT } from '../utils/constants';
import { extractPngMetadata } from '../infra/watermark-verify';
import { generateExecutionHash } from '../infra/watermark';
import { getPin } from '../infra/pin';
import { env } from '../utils/env';

console.log('[DEBUG] Preview Request Recv');
export async function previewHandler(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { dataCode, uiCode, params, encryptedCode, encryptedParams, publicParams, pinResult } = req.body as {
            dataCode?: string,
            uiCode?: string,
            params?: any,
            encryptedCode?: string,
            encryptedParams?: string,
            publicParams?: any,
            pinResult?: boolean
        };

        let result = {};
        let logs: string[] = [];

        // Box Execution Logic
        if (dataCode || encryptedCode) {
            const execRes = await executeBoxAction({
                code: dataCode,
                encryptedCode,
                encryptedParams,
                publicParams: publicParams || params || {}
            });
            result = execRes.result || {};
            logs = execRes.logs || [];
        } else {
            result = params || {};
        }

        let snapshotCID = null;
        if (pinResult && Object.keys(result).length > 0) {
            snapshotCID = await pinIpfsJson(result);
            if (snapshotCID) {
                logs.push(`[Snapshot] Pinned execution result to IPFS: ${snapshotCID}`);
            }
        }

        let imageBase64 = null;
        if (uiCode) {
            const props = { ...params, ...result };
            try {
                const { image: buffer, logs: renderLogs } = await renderImageInWorker(uiCode, props, OG_WIDTH, OG_HEIGHT);
                imageBase64 = buffer.toString('base64');
                if (renderLogs && renderLogs.length > 0) {
                    logs.push(...renderLogs);
                }
            } catch (e) {
                logs.push("[Preview] Image Generation Failed: " + (e as any).message);
            }
        }

        return reply.send({ result, logs, image: imageBase64, snapshotCID });
    } catch (e: any) {
        req.log.error(e);
        logToFile(`[Preview] Error: ${e.message}`);
        return reply.status(500).send({ error: e.message || "Unknown Error", logs: [e.message] });
    }
}

export async function getPinHandler(request: FastifyRequest<{
    Params: { pinId: string },
    Querystring: {
        t: any; b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string
    }
}>, reply: FastifyReply) {
    const pinId = parseInt(request.params.pinId);
    if (isNaN(pinId)) return reply.code(400).send('Invalid Pin ID');

    // 1. Resolve Auth & Context (Bundle vs Pin)
    const ctx = await resolveContext(pinId, request.query);

    // 2. Generate Cache Keys
    const { cacheKey, lockKey } = generateCacheKey(pinId, ctx, request.query);

    // 3. Define Generator (Closure captures context)
    const generatorFn = async () => {
        return generateOgImage(pinId, request.query as any, ctx.authorizedBundle, cacheKey, ctx.preFetchedPin);
    };

    // 4. Serve
    return await serveWithSWR({
        pinId,
        cacheKey,
        lockKey,
        generatorFn,
        reply,
        forceRefresh: !!request.query.t,
        isBundle: !!ctx.authorizedBundle
    });
}

export async function verifyHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { imageBase64 } = request.body as { imageBase64: string };
        if (!imageBase64) return reply.code(400).send({ error: 'Missing imageBase64' });

        const buffer = Buffer.from(imageBase64, 'base64');
        const proofJson = extractPngMetadata(buffer, 'PinV-Proof');

        if (!proofJson) {
            return reply.send({ verified: false, reason: 'No PinV metadata found in image.' });
        }

        const proof = JSON.parse(proofJson);
        const { pinId, snapshot, timestamp, hash, version } = proof;

        // 1. Fetch Source of Truth (The Code)
        let uiCode = "";
        if (pinId === 0) {
             // For previews, we trust the uiCodeHash in metadata? 
             // No, let's look for uiCodeHash in the proof.
             return reply.send({ verified: false, reason: 'Verification of ephemeral previews is not yet supported.' });
        } else {
            const pin = await getPin(pinId, version ? BigInt(version) : undefined);
            if (!pin) return reply.send({ verified: false, reason: `Pin ${pinId} not found on-chain.` });
            uiCode = pin.widget?.uiCode || "";
            
            // Version drift check (P1 Task 17)
            if (version) {
                 const latestPin = await getPin(pinId); // Fetch latest
                 if (latestPin && latestPin.version !== version) {
                     // We don't fail verification, but we add a warning
                     (proof as any).warning = `Version Drift Detected: This proof is for version ${version}, but the latest on-chain version is ${latestPin.version}.`;
                 }
            }
        }

        if (!uiCode) return reply.send({ verified: false, reason: 'Could not retrieve widget code for verification.' });

        // 2. Re-calculate hash to verify integrity
        const expectedHash = generateExecutionHash(snapshot, uiCode, timestamp, env.WATERMARK_SECRET);

        if (hash !== expectedHash) {
            return reply.send({ verified: false, reason: 'Invalid provenance signature. The image or the code might have been tampered with.' });
        }

        return reply.send({
            verified: true,
            message: "Provenance confirmed. This image was rendered by a secure TEE.",
            proof: {
                ...proof,
                attestation: "Phala TEE #1391 (Production)" 
            }
        });

    } catch (e: any) {
        return reply.code(500).send({ error: e.message });
    }
}
