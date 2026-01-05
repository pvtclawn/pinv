import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitActionResource, LitPKPResource, createSiweMessage } from '@lit-protocol/auth-helpers';
import { LIT_CONFIG } from './config';
import { LitClientError } from './errors';
import { ethers } from 'ethers';

export class LitClient {
    private client: LitNodeClient;
    private connected: boolean = false;
    private wallet: ethers.Wallet;

    constructor() {
        this.client = new LitNodeClient({
            litNetwork: LIT_CONFIG.NETWORK as any, // Cast to avoid type mismatch with literal enum
            debug: LIT_CONFIG.DEBUG
        });
        // Ephemeral wallet for signing session requests
        this.wallet = ethers.Wallet.createRandom() as unknown as ethers.Wallet;
    }

    async connect() {
        if (this.connected) return;
        try {
            await this.client.connect();
            this.connected = true;
            console.log(`LitClient connected to ${LIT_CONFIG.NETWORK}`);
        } catch (e) {
            throw new LitClientError('Failed to connect to Lit network', e);
        }
    }

    async getSessionSigs() {
        // Generate session sigs for this wallet to execute actions
        return await this.client.getSessionSigs({
            chain: 'ethereum', // Chain doesn't matter much for off-chain execution usually, but must be valid
            expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
            resourceAbilityRequests: [
                {
                    resource: new LitActionResource('*') as any,
                    ability: 'lit-action-execution' as any, // Hardcoded ability
                },
            ],
            authNeededCallback: async ({
                uri,
                expiration,
                resourceAbilityRequests,
            }) => {
                const toSign = await createSiweMessage({
                    uri,
                    expiration,
                    resources: resourceAbilityRequests as any,
                    walletAddress: this.wallet.address,
                    nonce: await this.client.getLatestBlockhash(),
                    litNodeClient: this.client,
                });

                const signature = await this.wallet.signMessage(toSign);

                return {
                    sig: signature,
                    derivedVia: 'web3.eth.personal.sign',
                    signedMessage: toSign,
                    address: this.wallet.address,
                };
            },
        });
    }

    async executeAction(code: string | undefined, ipfsId: string | undefined, jsParams: Record<string, any>) {
        if (!this.connected) await this.connect();

        try {
            const sessionSigs = await this.getSessionSigs();

            // We use 'executeJs' which is the standard way to run a Lit Action
            const res = await this.client.executeJs({
                code,
                ipfsId,
                jsParams,
                sessionSigs
                // We typically don't need authSig for pure execution unless the action uses PKP.
                // For this use case (off-chain verification), we might not need a session sig 
                // IF the action is purely computational or reads public data.
                // However, EIP-712 auth usually implies we just run logic.
                // If we need to sign *inside* Lit, we need PKPs. 
                // Our requirements: "returns { ok: true ... }" - no signing output mentioned for this task.
                // So no authSig needed for now?
                // Actually, executeJs requires an authSig if we are accessing encrypted content
                // OR if the node requires it. For public actions, it might be optional depending on network/version.
                // But typically we provide a random session sig or similar if needed.
                // For now, let's try without session signatures if possible, or generate a throwaway one if SDK complaints.
                // UPDATE: Lit v6 usually requires a session signature (SessionSigs).
                // For "read-only" / "compute" actions, we can often just pass an empty authSig or similar if allowed.
                // Let's Stub it for now and refine in testing.
            });

            return res;
        } catch (e) {
            throw new LitClientError('Failed to execute Lit Action', e);
        }
    }

    // Helper to parse the JSON response from Lit Action
    parseResponse<T>(res: any): T {
        try {
            // response is usually a stringified JSON in `response` field
            if (res.response) {
                return JSON.parse(res.response) as T;
            }
            // Sometimes it might come as just string if setResponse called with string?
            // But we formatted it as JSON in our actions.
            if (typeof res === 'string') {
                // Try parsing, maybe it's the raw response
                try {
                    return JSON.parse(res);
                } catch (e) { }
            }

            // If logs are present and response missing, print logs?
            if (!res.response && res.logs) {
                console.error("Lit Action Logs:", res.logs);
            }

            throw new Error('No response field in Lit result');
        } catch (e: any) {
            throw new LitClientError(`Failed to parse Lit Action response: ${e.message}`, e);
        }
    }
}
