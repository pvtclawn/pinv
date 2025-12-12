import { blockchainService } from "@/lib/blockchain-service";
import PinEditor from "@/components/features/editor/PinEditor";
import { notFound } from "next/navigation";

export default async function EditPinPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params;
    const pinId = parseInt(idStr);
    const pin = await blockchainService.getPin(pinId);

    if (!pin) {
        notFound();
    }

    return <PinEditor pinId={pinId} pin={pin} />;
}
