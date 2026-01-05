import { LitClient } from '../src/litClient';
import { LIT_CONFIG } from '../src/config';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

async function main() {
    console.log("Starting E2E Test Flow...");

    // 1. Setup Client
    const client = new LitClient();
    await client.connect();

    // 2. Load Action Code
    const authActionPath = path.join(__dirname, '../actions/pinv-auth-resolve.js');
    let authActionCode = fs.readFileSync(authActionPath, 'utf8');

    const execActionPath = path.join(__dirname, '../actions/pinv-exec-handler.js');
    const execActionCode = fs.readFileSync(execActionPath, 'utf8');

    // 3. Prepare Test Data
    const wallet = ethers.Wallet.createRandom();
    const tokenId = "1";
    const ts = Math.floor(Date.now() / 1000);

    const manifest = {
        uiCodeCid: "QmUiCode",
        handler: {
            type: "lit_action",
            cid: "QmDataCode" // This would be the IPFS CID of the handler
        },
        parameters: ["title"],
        previewData: { title: "Default" }
    };

    // We need to Mock the Manifest Fetch inside the Auth Action
    // because we don't have a real IPFS gateway in this test env.
    // We inject a mock fetch function at the top of the code.
    const mockManifestJson = JSON.stringify(manifest).replace(/"/g, '\\"');
    const mockFetch = `
      const fetch = async (url) => {
        if (url.includes("QmManifest")) {
            return {
                ok: true,
                text: async () => "${mockManifestJson}"
            };
        }
        return { ok: false };
      };
    `;
    // Prepend mock
    authActionCode = mockFetch + authActionCode;

    // We also need to Mock the ERC1155 check.
    // We can't easily mock the ethers call unless we mock the provider or the contract call.
    // OR we use a real wallet that has 0 balance on Sepolia and expect failure?
    // Or we expect failure for "unauthorized" and consider that a partial success of the flow logic?
    // BETTER: We can Mock the contract call too for this harness.
    // Inject a mock ethers global that intercepts? No, too hard.
    // EASIER: Inject a override for the balance check part.
    // We'll replace the line `const balance = await contractWithProvider.balanceOf(...)` 
    // with `const balance = { eq: () => false }; // Mock > 0`

    // Let's replace the whole verify block for the mock test?
    // Or, we can just log that we expect "unauthorized" if we don't own it.
    // BUT we want to test the full success flow.
    // Let's TRY to find a way to make it succeed.
    // We can replace the `ethers.Contract` instantiation or the method call.
    // Regex replace to mock:
    authActionCode = authActionCode.replace(
        /const balance = await contractWithProvider.balanceOf\(recoveredAddress, tokenId\);/g,
        `const balance = { eq: (val) => val === 0 ? false : true }; // MOCK: Always has balance`
    );


    // 4. Create Bundle & Sign
    const bundle = {
        ver: "QmManifestMock",
        params: { title: "Hello Lit" },
        ts: ts
    };

    // Canonicalize params for hash
    // We can use the same logic or a simple one since we control the object key order here
    const canonicalParams = '{"title":"Hello Lit"}';
    const paramsHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalParams));

    const domain = {
        name: 'PinV',
        version: '1',
        chainId: LIT_CONFIG.CHAIN_ID,
        verifyingContract: LIT_CONFIG.ERC1155_ADDRESS || ethers.ZeroAddress
    };

    const types = {
        Auth: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'ver', type: 'string' },
            { name: 'paramsHash', type: 'bytes32' },
            { name: 'ts', type: 'uint256' }
        ]
    };

    const value = {
        tokenId,
        ver: bundle.ver,
        paramsHash,
        ts
    };

    const sig = await wallet.signTypedData(domain, types, value);
    console.log("Signed Bundle. Sig:", sig.slice(0, 20) + "...");

    // 5. Execute Auth Action
    console.log("\n--- Executing Auth Action ---");
    const jsParams = {
        tokenId,
        bundle,
        sig,
        chainId: LIT_CONFIG.CHAIN_ID,
        contractAddress: LIT_CONFIG.ERC1155_ADDRESS || ethers.ZeroAddress,
        ipfsGatewayBase: "https://mock-gateway/",
        tsMaxAgeSec: 86400,
        tsFutureSkewSec: 600
    };

    const authRes = await client.executeAction(authActionCode, undefined, jsParams);
    // Parse result
    const authResult = client.parseResponse<any>(authRes);
    console.log("Auth Result:", JSON.stringify(authResult, null, 2));

    if (!authResult.ok) {
        console.error("Auth failed!", authResult.reason);
        process.exit(1);
    }

    // 6. Execute Handler Action
    console.log("\n--- Executing Handler Action ---");
    // Since we mocked the manifest, we got `handlerCid: "QmHandlerRemoteCid"`.
    // In a real execution, we'd pass this CID to `Lit.Actions.call`.
    // In this test harness, `pinv-exec-handler.js` tries to call `Lit.Actions.call`.
    // Since we don't have that CID uploaded, `Lit.Actions.call` will fail if we let it run natively.
    // We need to MOCK `Lit.Actions.call` inside `pinv-exec-handler.js`.

    // Or simpler: We just run the Code of the handler directly here to prove it works?
    // No, we want to test the `pinv-exec-handler.js`.

    // We'll inject a mock `Lit.Actions.call` into `execActionCode`.
    const mockHandlerResponse = JSON.stringify({ ok: true, props: { title: "Rendered: Hello Lit" } }).replace(/"/g, '\\"');

    // Lit.Actions might be read-only. We can't easily overwrite it if it's frozen.
    // But we can try defining it if it's global.
    // Better: wrap the `Lit.Actions.call` in a helper derived from environment or something.
    // Or just try to overwrite `Lit.Actions = { ...Lit.Actions, call: ... }`.
    // Note: In SES, globals are often frozen.
    // If we can't mock it, we can't test `pinv-exec-handler.js` locally easily without real IPFS.
    // However, for this task, "Locally testable" is key.
    // Let's assume for the TEST we skip the real `Lit.Actions.call` and just return success if we detect test mode?
    // Or we use `try catch` and if it fails (due to bad CID), we return a "mock success" for the harness?
    // No, that hides bugs.

    // Let's overwrite the `go` function or logic in `execActionCode` via string replace?
    let testExecCode = execActionCode.replace(
        /const result = await Lit.Actions.call\({[\s\S]*?}\);/g,
        `const result = "${mockHandlerResponse}"; // MOCK call`
    );

    const execParams = {
        handlerCid: authResult.handlerCid,
        params: authResult.params,
        context: { viewer: "test-user" }
    };

    const execRes = await client.executeAction(testExecCode, undefined, execParams);
    const execResult = client.parseResponse<any>(execRes);
    console.log("Exec Result:", JSON.stringify(execResult, null, 2));

    if (!execResult.ok) {
        console.error("Exec failed!", execResult.reason);
        process.exit(1);
    }

    console.log("\nSUCCESS: Full flow verified.");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
