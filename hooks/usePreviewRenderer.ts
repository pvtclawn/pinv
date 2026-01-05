"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWalletClient, useAccount, useChainId } from "wagmi";
import { signBundle, encodeBundle, Bundle } from "@/lib/bundle-utils";

interface ManifestData {
    dataCode: string;
    uiCode: string;
    previewData: any;
    parameters: any[];
    userConfig?: any;
}

interface UsePreviewRendererReturn {
    render: (data: ManifestData, pinId: number) => Promise<string | null>;
    isLoading: boolean;
    imageUrl: string | null;
    error: string | null;
}

/**
 * Hook for rendering widget previews via the OG Engine (IPFS + Signed Bundle).
 * This ensures consistency with the production workflow.
 */
export function usePreviewRenderer(): UsePreviewRendererReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const chainId = useChainId();

    const render = useCallback(async (
        data: ManifestData,
        pinId: number
    ): Promise<string | null> => {
        if (!data.uiCode.trim()) {
            setError("No code provided for preview");
            return null;
        }

        if (!walletClient || !address) {
            setError("Wallet not connected. Please connect to sign the preview bundle.");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Get Signed Upload URL
            const tokenRes = await fetch('/api/pinata-token');
            if (!tokenRes.ok) throw new Error("Failed to get upload token");
            const { url: uploadUrl } = await tokenRes.json();

            // 2. Upload to Pinata via Signed URL
            // Ensure we upload as a File or Blob with correct type
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const file = new File([blob], "preview.json", { type: "application/json" });

            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                // Do not set Content-Type header manually; fetch will set multipart/form-data with boundary
            });

            if (!uploadRes.ok) {
                throw new Error(`Upload failed: ${uploadRes.statusText}`);
            }

            // Note: The direct upload response depends on Pinata's API.
            // For signed URLs (v3), it returns { data: { cid: ... } }
            // For older APIs, it might returns { IpfsHash: ... }
            const uploadData = await uploadRes.json();
            const cid = uploadData?.data?.cid || uploadData?.IpfsHash;

            if (!cid) throw new Error("No CID returned from signed upload");

            // 3. Create Bundle
            const bundle: Bundle = {
                ver: cid,
                params: data.previewData || {},
                ts: Math.floor(Date.now() / 1000)
            };

            // 4. Sign Bundle
            const signature = await signBundle(walletClient, address, pinId, bundle, chainId);

            // 5. Construct OG URL
            const encodedBundle = encodeBundle(bundle);
            const baseUrl = process.env.NEXT_PUBLIC_OG_URL || 'http://localhost:8080';
            const url = `${baseUrl}/og/${pinId}?b=${encodedBundle}&sig=${signature}`;

            setImageUrl(url);
            return url;

        } catch (err) {
            const message = err instanceof Error ? err.message : "Preview render failed";
            setError(message);
            console.error("Preview rendering failed:", err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, address, chainId]);

    return {
        render,
        isLoading,
        imageUrl,
        error,
    };
}
