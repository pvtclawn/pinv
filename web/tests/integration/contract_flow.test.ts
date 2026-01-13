import { describe, it, expect, beforeAll } from 'vitest';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { pinVAbi, pinVAddress } from '../../hooks/contracts';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const CHAIN = baseSepolia;
const ADDRESS = pinVAddress[84532];

describe('Contract Integration Flow (Live Testnet)', () => {
    let walletClient: any;
    let publicClient: any;
    let account: any;

    beforeAll(() => {
        const pk = process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;
        if (!pk) {
            console.warn("SKIPPING: No PRIVATE_KEY found in .env. Cannot run integration test.");
            return;
        }
        account = privateKeyToAccount(pk as `0x${string}`);

        walletClient = createWalletClient({
            account,
            chain: CHAIN,
            transport: http()
        });

        publicClient = createPublicClient({
            chain: CHAIN,
            transport: http()
        });
    });

    it('should mint a Pin on Base Sepolia', async () => {
        if (!account) return;

        console.log(`Minting from ${account.address}...`);

        // 1. Estimate Gas / Simulate
        const { request } = await publicClient.simulateContract({
            address: ADDRESS,
            abi: pinVAbi,
            functionName: 'mint',
            account,
            args: [
                account.address,        // to
                "Integration Test Pin", // title
                " Automated Test",      // tagline
                "QmTestHash123",        // ipfs
                "0x"                    // data
            ],
            value: parseEther("0.0001") // Ensure this matches contract config
        });

        // 2. Execute
        const hash = await walletClient.writeContract(request);
        console.log(`Tx Sent: ${hash}`);

        // 3. Wait for Receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        expect(receipt.status).toBe('success');

        console.log(`Minted! Block: ${receipt.blockNumber}`);
    }, 120000); // 2 min timeout for Testnet
});
