"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@/components/features/wallet";
import {
    useReadPinVPinStores,
    useSimulatePinVStoreAddVersion,
    useWritePinVStoreAddVersion,
    pinVConfig
} from "@/hooks/contracts";
import { chain } from "@/components/features/wallet";
import TxButton from "@/components/shared/TxButton";
import { notify } from "@/components/shared/Notifications";

interface SavePinButtonProps {
    pinId: number;
    title: string;
    tagline: string;
    uiCode: string;
    dataCode: string;
    parameters: any[];
    previewData: Record<string, unknown>;
    manifestCid: string | null;
    signature?: string;
    timestamp?: number;
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
    manifestCid,
    signature,
    timestamp,
    disabled,
    className
}: SavePinButtonProps) {
    const router = useRouter();
    const { loggedIn } = useAccount();

    // 1. Get Factory Address
    // @ts-ignore - address index signature
    const factoryAddress = pinVConfig.address[chain.id as keyof typeof pinVConfig.address];

    // 2. Read Store Address for this Pin
    const { data: storeAddress } = useReadPinVPinStores({
        args: [BigInt(pinId)],
        query: { enabled: !!pinId }
    });

    // 3. Update Backend Callback
    const handleBackendUpdate = async () => {
        try {
            const savePayload = {
                title,
                tagline,
                widget: {
                    dataCode: dataCode,
                    uiCode: uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData,
                    signature: signature || undefined,
                    timestamp: timestamp || undefined
                }
            };

            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin metadata to backend");

            notify('Pin version saved on-chain & metadata updated!', 'success');
            router.push(`/p/${pinId}`);
            router.refresh();
        } catch (e: any) {
            console.error("Backend sync failed:", e);
            notify(`Backend sync failed: ${e.message}`, 'error');
        }
    };

    return (
        <TxButton
            text="SAVE"
            variant="default"
            className={className || "min-w-[120px]"} // Default width if none passed, but Editor passes full width
            simulateHook={useSimulatePinVStoreAddVersion}
            writeHook={useWritePinVStoreAddVersion}
            params={{
                address: storeAddress,
                args: [manifestCid || ""],
                enabled: !!storeAddress && loggedIn && !!manifestCid && !disabled,
                onConfirmationSuccess: handleBackendUpdate
            }}
        />
    );
}
