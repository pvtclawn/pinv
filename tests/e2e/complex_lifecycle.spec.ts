import { test, expect } from '@playwright/test';
import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';

// Load ABI via FS to avoid Module Resolution issues
const artifactPath = path.resolve(__dirname, '../../contracts/out/PinV.sol/PinV.json');
if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found at ${artifactPath}`);
const PinVArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const pinVAbi = PinVArtifact.abi;

// Anvil Config
const anvil = defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});
const ANVIL_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0

test.describe.serial('Global Lifecycle (Full Stack)', () => {
    // Shared State
    let contractAddress: `0x${string}`;
    const MINT_HASH = "QmLocalHash";

    test.beforeAll(async () => {
        // Expect address from Environment (set by harness)
        contractAddress = process.env.LOCAL_CONTRACT_ADDRESS as `0x${string}`;
        if (!contractAddress) throw new Error("Missing LOCAL_CONTRACT_ADDRESS env var");
        console.log(`[Test] Targeting Contract: ${contractAddress}`);
    });

    test('Step 1: Mint a Pin on Local Chain', async () => {
        const account = privateKeyToAccount(ANVIL_PK);
        const walletClient = createWalletClient({ account, chain: anvil, transport: http() });
        const publicClient = createPublicClient({ chain: anvil, transport: http() });

        // Mint Token #1
        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            abi: pinVAbi,
            functionName: 'mint',
            account,
            args: [
                account.address,
                "E2E Test Pin",
                "Full Stack Verified",
                MINT_HASH,
                "0x"
            ],
            value: parseEther("0.001")
        });

        const hash = await walletClient.writeContract(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        expect(receipt.status).toBe('success');
        console.log(`[Test] Minted Token #1 in block ${receipt.blockNumber}`);
    });

    test('Step 2: Fetch Pin from OG Engine (Cold Start)', async ({ request, baseURL }) => {
        // Wait briefly for "indexing" (though direct read should be instant)
        await new Promise(r => setTimeout(r, 2000));

        // Request Token #1
        // Note: baseURL will be localhost:3000 (OG Engine)
        const response = await request.get(`/og/1`);

        // Logging for debug
        console.log(`[Test] GET /og/1 Status: ${response.status()}`);
        console.log(`[Test] Headers:`, response.headers());

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');

        // Expect MISS or HIT-FRESH (first time might be fresh generation)
        const cacheStatus = response.headers()['x-cache'];
        expect(['MISS', 'HIT-FRESH', 'HIT-SWR']).toContain(cacheStatus);
    });

    test('Step 3: Fetch Pin from OG Engine (Hot Cache)', async ({ request }) => {
        // Request Token #1 AGAIN
        const response = await request.get(`/og/1`);

        expect(response.status()).toBe(200);

        // Expect HIT-SWR or HIT-FRESH (Memory or Redis)
        const cacheStatus = response.headers()['x-cache'];
        console.log(`[Test] Cache Status 2nd Request: ${cacheStatus}`);
        expect(cacheStatus).toContain('HIT');
    });

    test('Step 4: Verify Preview API (Stateless)', async ({ request }) => {
        const response = await request.post(`/og/preview`, {
            data: {
                uiCode: "export default () => <div>Stateless Preview</div>"
            }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.image).toBeTruthy();
    });
});
