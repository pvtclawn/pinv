import { blockchainService } from "@/lib/blockchain-service";
import PinEditor from "@/components/PinEditor";
import { notFound } from "next/navigation";

export default async function EditPin({ params }: { params: Promise<{ fid: string }> }) {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        notFound();
    }

    return <PinEditor fid={fid} pin={pin} />;
}
