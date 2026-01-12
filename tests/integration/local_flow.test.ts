import { describe, it, expect, beforeAll } from 'vitest';
import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { pinVAbi } from '../../hooks/contracts';

// Anvil Chain Definition
const anvil = defineChain({
    id: 31337,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

// Deterministic Anvil Account #0
const ANVIL_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe.skipIf(!process.env.LOCAL_CONTRACT_ADDRESS)('Foundry Localchain Integration', () => {
    let walletClient: any;
    let publicClient: any;
    let account: any;
    let contractAddress: `0x${string}`;

    beforeAll(() => {
        contractAddress = process.env.LOCAL_CONTRACT_ADDRESS as `0x${string}`;

        account = privateKeyToAccount(ANVIL_PK);

        walletClient = createWalletClient({
            account,
            chain: anvil,
            transport: http()
        });

        publicClient = createPublicClient({
            chain: anvil,
            transport: http()
        });
    });

    it('should mint on local Anvil chain', async () => {
        const balanceBefore = await publicClient.getBalance({ address: account.address });
        console.log(`Miner Balance: ${balanceBefore}`);

        // 1. Simulate Mint
        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            abi: pinVAbi,
            functionName: 'mint',
            account,
            args: [
                account.address,        // to
                "Local Test Pin",       // title
                "Serous Testing",       // tagline
                "QmLocalHash",          // ipfs
                "0x"                    // data
            ],
            value: parseEther("0.001") // Match Deploy Config
        });

        // 2. Execute
        const hash = await walletClient.writeContract(request);

        // 3. Verify Receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        expect(receipt.status).toBe('success');

        // 4. Verify Event (Mint)
        const logs = await publicClient.getContractEvents({
            address: contractAddress,
            abi: pinVAbi,
            eventName: 'Mint',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });

        expect(logs.length).toBeGreaterThan(0);
        console.log(`Mint Event Emitted: TokenID ${logs[0].args.tokenId}`);
    });
});
