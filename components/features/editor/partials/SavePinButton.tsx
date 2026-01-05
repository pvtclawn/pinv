"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { notify } from "@/components/shared/Notifications";

interface SavePinButtonProps {
    pinId: number;
    title: string;
    tagline: string;
    uiCode: string;
    dataCode: string;
    parameters: any[];
    previewData: Record<string, unknown>;
    disabled?: boolean;
    className?: string;
}

export function SavePinButton({
    pinId,
    title,
    tagline,
    uiCode,
    dataCode,
    parameters,
    previewData,
    disabled,
    className
}: SavePinButtonProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const uploadToIpfs = async (content: string | object, isFile = false) => {
        let body: string | FormData;
        const headers: Record<string, string> = {};

        if (isFile) {
            const formData = new FormData();
            const blob = new Blob([content as string], { type: 'text/plain' });
            formData.append('file', blob, 'code.js');
            body = formData;
        } else {
            body = JSON.stringify(content);
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch('/api/ipfs/upload', {
            method: 'POST',
            headers,
            body
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'IPFS upload failed');
        }

        const data = await res.json();
        return data.ipfsHash as string;
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // 1. Upload React Code (UI) as File
            const uiCodeCid = await uploadToIpfs(uiCode, true);
            console.log('Uploaded React Code:', uiCodeCid);

            // 2. Upload Handler Action (Data)
            const dataCodeCid = await uploadToIpfs(dataCode, true);
            console.log('Uploaded Handler Code:', dataCodeCid);

            // 3. Construct Manifest
            const manifest = {
                uiCodeCid: uiCodeCid,
                handler: {
                    type: "lit_action",
                    cid: dataCodeCid
                },
                parameters: parameters.map(p => p.name),
                previewData: previewData,
                renderHints: {
                    parameters: parameters
                }
            };

            // 4. Upload Manifest (JSON)
            const manifestCid = await uploadToIpfs(manifest, false);
            console.log('Uploaded Manifest:', manifestCid);

            // 5. Update Pin on Backend
            const savePayload = {
                title,
                tagline,
                version: manifestCid,
                widget: {
                    dataCode: dataCode,
                    uiCode: uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData,
                }
            };

            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin");

            notify('Pin saved & published to IPFS!', 'success');

            router.push(`/p/${pinId}`);
            router.refresh();
        } catch (e: any) {
            console.error("Save failed:", e);
            notify(`Save failed: ${e.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Button
            onClick={handleSave}
            disabled={disabled || isSaving}
            isLoading={isSaving}
            className={className}
            icon={isSaving ? Loader2 : Save}
        >
            {isSaving ? "PUBLISHING..." : "SAVE"}
        </Button>
    );
}
